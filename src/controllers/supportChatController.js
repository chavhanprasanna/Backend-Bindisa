import SupportChat from '../models/SupportChat.js';
import { v4 as uuidv4 } from 'uuid';

function isParticipant(chat, userId) {
  return chat.userId === userId || chat.agentId === userId;
}

export async function createConversation(req, res, next) {
  try {
    const { text } = req.body;
    const chat = await SupportChat.create({
      userId: req.user.sub,
      messages: text ? [{ _id: uuidv4(), senderId: req.user.sub, text, timestamp: new Date() }] : [],
      lastMessageAt: new Date()
    });
    res.status(201).json(chat);
  } catch (err) {
    next(err);
  }
}

export async function listConversations(req, res, next) {
  try {
    const chats = await SupportChat.find({ userId: req.user.sub }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const chat = await SupportChat.findById(conversationId);
    if (!chat || !isParticipant(chat, req.user.sub)) return res.status(404).json({ message: 'Not found' });
    res.json(chat.messages);
  } catch (err) {
    next(err);
  }
}

export async function postMessage(req, res, next) {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text required' });

    const chat = await SupportChat.findById(conversationId);
    if (!chat || !isParticipant(chat, req.user.sub)) return res.status(404).json({ message: 'Not found' });

    const message = { _id: uuidv4(), senderId: req.user.sub, text, timestamp: new Date() };
    chat.messages.push(message);
    chat.lastMessageAt = new Date();
    await chat.save();
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
}
