require 'httparty'

class CohereService
  def self.chat(message)
    url = "https://api.cohere.ai/v1/chat"

    headers = {
      "Authorization" => "Bearer #{ENV['COHERE_API_KEY']}",
      "Content-Type" => "application/json"
    }

    body = {
      message: message,
      chat_history: [], # You can add history if you want
      model: "command-r" # Use a free conversational model
    }

    response = HTTParty.post(url, headers: headers, body: body.to_json)
    json = JSON.parse(response.body)

    if json["text"]
      json["text"]
    else
      "Sorry, I couldn't generate a response."
    end
  rescue => e
    "Cohere API Error: #{e.message}"
  end
end