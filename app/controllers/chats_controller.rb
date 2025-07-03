class ChatsController < ApplicationController
  def create
    user_message = params[:message]
    reply = CohereService.chat(user_message)

    render json: { reply: reply }
  end
end