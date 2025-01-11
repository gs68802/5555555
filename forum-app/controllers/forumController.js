const { Translate } = require('@google-cloud/translate').v2;
const Message = require('../models/Message');
const Forum = require('../models/Forum');

const translate = new Translate({
    projectId: process.env.GOOGLE_PROJECT_ID,
    key: process.env.GOOGLE_API_KEY
});

// Create a new forum
exports.createForum = async (req, res) => {
    try {
        const { title, description } = req.body;
        const createdBy = req.user._id; // Assuming req.user is populated by the authentication middleware

        const newForum = new Forum({
            title,
            description,
            createdBy
        });

        await newForum.save();
        res.status(201).json(newForum);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};

exports.getForums = async (req, res) => {
    try {
        const forums = await Forum.find();
        res.status(200).json(forums);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getForums = async (req, res) => {
    try {
        const forums = await Forum.find();
        res.status(200).json(forums);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all forums
exports.getForums = async (req, res) => {
    try {
        const forums = await Forum.find().populate('createdBy', 'username');
        res.status(200).json(forums);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get a specific forum by ID
exports.getForumById = async (req, res) => {
    try {
        const forum = await Forum.findById(req.params.id).populate('createdBy', 'username');
        if (!forum) {
            return res.status(404).json({ error: 'Forum not found' });
        }
        res.status(200).json(forum);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update a forum
exports.updateForum = async (req, res) => {
    try {
        const { title, description } = req.body;
        const forum = await Forum.findByIdAndUpdate(
            req.params.id,
            { title, description },
            { new: true, runValidators: true }
        );

        if (!forum) {
            return res.status(404).json({ error: 'Forum not found' });
        }

        res.status(200).json(forum);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};

// Delete a forum
exports.deleteForum = async (req, res) => {
    try {
        const forum = await Forum.findByIdAndDelete(req.params.id);

        if (!forum) {
            return res.status(404).json({ error: 'Forum not found' });
        }

        res.status(200).json({ message: 'Forum deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.postMessage = async (req, res) => {
    const { text } = req.body;
    const preferredLanguage = req.user.preferredLanguage;

    try {
        const [translation] = await translate.translate(text, 'en');
        const newMessage = new Message({
            userId: req.user.userId,
            originalText: text,
            translatedText: translation
        });

        await newMessage.save();
        res.status(201).json({ message: 'Message posted successfully' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ error: 'Server error' });
    }
};

exports.viewMessages = async (req, res) => {
    const preferredLanguage = req.user.preferredLanguage;

    try {
        const messages = await Message.find();
        const translations = await Promise.all(messages.map(async (message) => {
            const [translation] = await translate.translate(message.translatedText, preferredLanguage);
            return {
                ...message._doc,
                translatedText: translation
            };
        }));

        res.json(translations);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};