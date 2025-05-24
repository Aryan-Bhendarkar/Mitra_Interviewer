# Voice Interview Testing Guide

## Overview
This guide explains the voice functionality improvements made to replace VAPI with Web Speech API and how to test the listening problem fix.

## Key Improvements Made

### 1. Enhanced Listening Restart Logic
- **Multiple restart mechanisms**: Automatic restart after speech recognition ends, after AI speech completes, and on errors
- **Longer delays**: Added 1000ms delay for general restarts, 800ms after AI speech, 1500ms for no-speech errors
- **Heartbeat monitoring**: Every 5 seconds, checks if listening should be active and restarts if needed
- **Error-specific handling**: Different restart strategies for different types of speech recognition errors

### 2. Visual Feedback Improvements
- **Processing indicator**: Shows "AI is thinking..." with spinning icon when processing user input
- **Listening indicator**: Green pulsing dot shows when actively listening
- **Tap to Speak button**: Appears after 3 seconds of no listening to manually restart
- **Question progress**: Shows progress bar for interview questions

### 3. Better Error Handling
- **Microphone permission detection**: Clear error messages for permission issues
- **Browser compatibility**: Checks for Web Speech API support
- **Retry logic**: Automatic retry on recoverable errors with exponential backoff

## Testing the Listening Issue Fix

### Problem: Interview stops listening after 2nd question

### Test Steps:

1. **Access the Application**
   - Navigate to http://localhost:3000
   - Sign in to your account

2. **Start an Interview**
   - Go to "Interview" section
   - Create or select an existing interview
   - Click "Start Interview"

3. **Test Voice Interaction**
   - Allow microphone permissions when prompted
   - Wait for the AI to ask the first question
   - Answer the question clearly
   - **Critical Test**: Pay attention after the 2nd question
   - Check if the green "Listening..." indicator appears
   - Look for the "Tap to Speak" button if listening stops

4. **Verify Restart Mechanisms**
   - If listening stops, try the "Tap to Speak" button
   - Wait for the 5-second heartbeat to restart listening automatically
   - Check browser console for restart logs

### Expected Behavior:
- ✅ Listening should restart automatically after each AI response
- ✅ "Listening..." indicator should appear consistently
- ✅ "AI is thinking..." should show during processing
- ✅ "Tap to Speak" button should work if manual restart is needed
- ✅ Conversation should continue smoothly through all questions

### Debug Information:
Check browser console for these logs:
- `Starting speech recognition...`
- `Heartbeat: Restarting listening...`
- `Force restart: Starting listening...`
- Speech recognition state changes

## Manual Testing Scenarios

### Scenario 1: Normal Flow
1. Start interview
2. Answer 3-4 questions naturally
3. Verify listening restarts after each response

### Scenario 2: Long Pauses
1. Start interview
2. Answer first question, then stay silent for 10+ seconds
3. Verify heartbeat restarts listening
4. Continue with second question

### Scenario 3: Manual Restart
1. Start interview
2. If listening stops, use "Tap to Speak" button
3. Verify it restarts properly

### Scenario 4: Error Recovery
1. Start interview
2. Temporarily revoke microphone permission
3. Re-grant permission
4. Verify recovery mechanism works

## Common Issues and Solutions

### Issue: Listening doesn't restart
**Solution**: Check browser console for errors, try "Tap to Speak" button

### Issue: No microphone permission
**Solution**: Click the microphone icon in browser address bar and allow

### Issue: Speech recognition not working
**Solution**: Use Chrome, Edge, or Safari (Firefox doesn't support Web Speech API)

### Issue: AI responses are slow
**Solution**: This is normal - processing indicator shows "AI is thinking..."

## Performance Monitoring

Monitor these metrics during testing:
- Time between user speech end and AI response start
- Listening restart success rate
- Error frequency and types
- User experience smoothness

## Browser Compatibility

### Fully Supported:
- ✅ Chrome 25+
- ✅ Edge 79+
- ✅ Safari 14.1+

### Not Supported:
- ❌ Firefox (Web Speech API not implemented)
- ❌ Internet Explorer

## Next Steps for Production

1. **Google Cloud Text-to-Speech Integration**: Replace browser TTS with Google Cloud TTS for better voice quality
2. **Advanced Error Handling**: Add retry limits and graceful degradation
3. **Voice Settings**: Allow users to select preferred voice and speech rate
4. **Analytics**: Add tracking for voice interaction success rates

## Troubleshooting Commands

```bash
# Check if development server is running
netstat -an | findstr :3000

# View real-time logs
# Open browser console (F12) and watch for voice service logs

# Restart development server if needed
npm run dev
```

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify microphone permissions
3. Try refreshing the page
4. Use supported browsers only
5. Check network connectivity for AI responses
