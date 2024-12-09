const mongoose = require('mongoose');

const fileRecordSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true,
        index: true
    },
    fileHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    downloadCount: {
        type: Number,
        default: 1
    },
    //userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to Use
    firstDownloadedBy: {
        type: String,
        required: true
    },
    downloadHistory: [{
        userId: { type: String, required: true },
        downloadedAt: Date,
        status: String // 'completed' or 'cancelled'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FileRecord', fileRecordSchema);
