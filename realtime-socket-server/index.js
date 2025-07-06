const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios'); 

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const fetchPromptData = async () => {
  try {
    const response = await axios.get('http://localhost:3000/chat');
    return response.data;
  } catch (error) {
    console.error('Error fetching prompt data:', error);
    return []; 
  }
};

const getMockPromptData = () => {
  return [
    {
      id: 1,
      conversation_id: 'conv_001',
      message: 'Hello, how can I help you today?',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      conversation_id: 'conv_002',
      message: 'What is the weather like?',
      timestamp: new Date().toISOString()
    }
  ];
};

io.on('connection', async (socket) => {
  console.log('User connected:', socket.id);
  
  try {
    const promptData = await fetchPromptData();
    socket.emit('init_prompt_list', promptData);
    
  } catch (error) {
    console.error('Error sending initial prompt list:', error);
    socket.emit('init_prompt_list', []);
  }
  
  socket.on('new_prompt_submitted', (promptData) => {
    console.log('New prompt submitted:', promptData);
    
    io.emit('new_prompt', promptData);
  });
  
  socket.on('request_prompt_update', async () => {
    try {
      const updatedPrompts = await fetchPromptData();
      socket.emit('prompt_list_updated', updatedPrompts);
    } catch (error) {
      console.error('Error fetching updated prompts:', error);
    }
  });
  
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

io.on('error', (error) => {
  console.error('Socket.IO server error:', error);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount 
  });
});

app.use(express.json());

app.post('/broadcast', (req, res) => {
  const { id, conversation_id, message } = req.body;
  
  console.log('Broadcast request received:', req.body);
  
  if (!id || !message) {
    return res.status(400).json({ error: 'id and message are required' });
  }
  
  const promptData = {
    id,
    conversation_id,
    message,
    timestamp: new Date().toISOString()
  };
  
  io.emit('new_prompt', promptData);
  
  console.log('Broadcasted new prompt to all clients:', promptData);
  
  res.json({ 
    success: true, 
    message: 'Prompt broadcasted successfully',
    data: promptData 
  });
});

app.post('/broadcast-prompt', express.json(), (req, res) => {
  const { promptData } = req.body;
  
  if (!promptData) {
    return res.status(400).json({ error: 'promptData is required' });
  }
  
  io.emit('new_prompt', promptData);
  
  res.json({ success: true, message: 'Prompt broadcasted successfully' });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
  });
});