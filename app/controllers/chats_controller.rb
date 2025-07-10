require 'net/http'
require 'uri'
require 'json'

class ChatsController < ApplicationController
  def create
    user_message = params[:message]
    conversation_id = params[:conversation_id]

    puts "Incoming message: #{user_message}, conversation_id: #{conversation_id}"

    if user_message.blank?
      render json: { error: 'Message cannot be empty' }, status: :bad_request
      return
    end

    begin
      reply = CohereService.chat(user_message)
      puts "AI reply generated: #{reply}"
    rescue => e
      puts "Error generating AI reply: #{e.message}"
      render json: { error: 'Failed to generate AI response' }, status: :internal_server_error
      return
    end

    begin
      prompt = ChatPrompt.create(
        message: user_message,
        reply: reply,
        conversation_id: conversation_id.presence
      )

      if prompt.conversation_id.nil?
        prompt.update(conversation_id: prompt.id)
        puts "Assigned new conversation_id: #{prompt.id}"
      end
    rescue => e
      puts "Error saving prompt: #{e.message}"
      render json: { error: 'Failed to save prompt' }, status: :internal_server_error
      return
    end

    broadcast_to_websocket(prompt)

    render json: {
      reply: prompt.reply,
      conversation_id: prompt.conversation_id,
      message_id: prompt.id
    }
  end

  def index
    begin
      prompts = ChatPrompt.order(created_at: :desc)
                         .as_json(only: [:id, :message, :reply, :created_at, :conversation_id])
      render json: prompts
    rescue => e
      puts "Error fetching prompts: #{e.message}"
      render json: { error: 'Failed to fetch prompts' }, status: :internal_server_error
    end
  end

  def conversation
    begin
      prompts = ChatPrompt.where(conversation_id: params[:id]).order(:created_at)
      render json: prompts
    rescue => e
      puts "Error fetching conversation: #{e.message}"
      render json: { error: 'Failed to fetch conversation' }, status: :internal_server_error
    end
  end

  def destroy
    begin
      prompt = ChatPrompt.find(params[:id])
      conversation_id = prompt.conversation_id
      prompt.destroy
      
      puts "Deleted prompt with id: #{params[:id]}"
      
      broadcast_deletion_to_websocket(params[:id])
      
      render json: { 
        message: 'Prompt deleted successfully',
        deleted_id: params[:id],
        conversation_id: conversation_id
      }, status: :ok
      
    rescue ActiveRecord::RecordNotFound
      puts "Prompt not found with id: #{params[:id]}"
      render json: { error: 'Prompt not found' }, status: :not_found
    rescue => e
      puts "Error deleting prompt: #{e.message}"
      render json: { error: 'Failed to delete prompt' }, status: :internal_server_error
    end
  end

  private

  def broadcast_to_websocket(prompt)
    uri = URI("http://localhost:4000/broadcast")
    http = Net::HTTP.new(uri.host, uri.port)
    http.read_timeout = 5 
    http.open_timeout = 5 
    
    request = Net::HTTP::Post.new(uri.path, 'Content-Type' => 'application/json')
    request.body = {
      id: prompt.id,
      conversation_id: prompt.conversation_id,
      message: prompt.message,
      reply: prompt.reply,
      created_at: prompt.created_at
    }.to_json

    puts "Sending POST to WebSocket server with body: #{request.body}"

    begin
      response = http.request(request)
      puts "WebSocket server responded with status: #{response.code}"
      
      if response.code == '200'
        puts "Successfully broadcasted to WebSocket clients"
      else
        puts "WebSocket broadcast failed with status: #{response.code}, body: #{response.body}"
      end
    rescue Net::TimeoutError => e
      puts "WebSocket broadcast timeout: #{e.message}"
    rescue Errno::ECONNREFUSED => e
      puts "WebSocket server connection refused: #{e.message}"
    rescue => e
      puts "WebSocket broadcast failed: #{e.message}"
    end
  end

  def broadcast_deletion_to_websocket(prompt_id)
    uri = URI("http://localhost:4000/broadcast-delete")
    http = Net::HTTP.new(uri.host, uri.port)
    http.read_timeout = 5 
    http.open_timeout = 5 
    
    request = Net::HTTP::Post.new(uri.path, 'Content-Type' => 'application/json')
    request.body = {
      deleted_id: prompt_id,
      action: 'delete'
    }.to_json

    puts "Sending DELETE broadcast to WebSocket server with body: #{request.body}"

    begin
      response = http.request(request)
      puts "WebSocket delete broadcast responded with status: #{response.code}"
      
      if response.code == '200'
        puts "Successfully broadcasted deletion to WebSocket clients"
      else
        puts "WebSocket delete broadcast failed with status: #{response.code}, body: #{response.body}"
      end
    rescue Net::TimeoutError => e
      puts "WebSocket delete broadcast timeout: #{e.message}"
    rescue Errno::ECONNREFUSED => e
      puts "WebSocket delete broadcast connection refused: #{e.message}"
    rescue => e
      puts "WebSocket delete broadcast failed: #{e.message}"
    end
  end
end