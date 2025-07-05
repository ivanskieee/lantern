require 'net/http'
require 'uri'
require 'json'

class ChatsController < ApplicationController
  def create
    user_message = params[:message]
    conversation_id = params[:conversation_id]

    puts "📨 Incoming message: #{user_message}, conversation_id: #{conversation_id}"

    reply = CohereService.chat(user_message)
    puts "🤖 AI reply generated: #{reply}"

    prompt = ChatPrompt.create(
      message: user_message,
      reply: reply,
      conversation_id: conversation_id.presence
    )

    if prompt.conversation_id.nil?
      prompt.update(conversation_id: prompt.id)
      puts "🆕 Assigned new conversation_id: #{prompt.id}"
    end

    # 🛰️ Prepare WebSocket broadcast
    uri = URI("http://localhost:4000/broadcast")
    http = Net::HTTP.new(uri.host, uri.port)
    request = Net::HTTP::Post.new(uri.path, 'Content-Type' => 'application/json')
    request.body = {
      id: prompt.id,
      conversation_id: prompt.conversation_id,
      message: prompt.message
    }.to_json

    puts "📡 Sending POST to WebSocket server with body: #{request.body}"

    begin
      response = http.request(request)
      puts "✅ WebSocket server responded with status: #{response.code}"
    rescue => e
      puts "❌ WebSocket broadcast failed: #{e.message}"
    end

    render json: {
      reply: prompt.reply,
      conversation_id: prompt.conversation_id
    }
  end

  def index
    prompts = ChatPrompt.order(created_at: :desc).as_json(only: [:id, :message, :reply, :created_at, :conversation_id])
    render json: prompts
  end

  def conversation
    prompts = ChatPrompt.where(conversation_id: params[:id]).order(:created_at)
    render json: prompts
  end
end
