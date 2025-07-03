class ChatsController < ApplicationController
  def create
    user_message = params[:message]
    conversation_id = params[:conversation_id]

    reply = CohereService.chat(user_message)

    prompt = ChatPrompt.create(
      message: user_message,
      reply: reply,
      conversation_id: conversation_id.presence 
    )

    if prompt.conversation_id.nil?
      prompt.update(conversation_id: prompt.id)
    end

    render json: { reply: prompt.reply, conversation_id: prompt.conversation_id }
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
