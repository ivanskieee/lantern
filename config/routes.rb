Rails.application.routes.draw do
  post "/chat", to: "chats#create"
end
