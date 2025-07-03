class CreateChatPrompts < ActiveRecord::Migration[7.2]
  def change
    create_table :chat_prompts do |t|
      t.text :message
      t.text :reply

      t.timestamps
    end
  end
end
