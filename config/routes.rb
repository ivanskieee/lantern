Rails.application.routes.draw do
  post "/chat", to: "chats#create"
  get "/chat", to: "chats#index"
  get 'chat/conversation/:id', to: 'chats#conversation'
  delete '/chat/:id', to: 'chats#destroy'
  
  match '*path', to: 'chats#options', via: :options
end