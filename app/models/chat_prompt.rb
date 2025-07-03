class ChatPrompt < ApplicationRecord
  validates :message, presence: true
  validates :reply, presence: true
end
