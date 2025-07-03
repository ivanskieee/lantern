class AddConversationIdToChatPrompts < ActiveRecord::Migration[7.2]
  def change
    add_column :chat_prompts, :conversation_id, :integer
  end
end
