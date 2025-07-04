# GlobalGaming - Amazon IVS Live Streaming Platform

A modern esports streaming platform built with React + Vite and Amazon IVS for ultra-low latency live streaming.

## 🚀 Features

- **Ultra-Low Latency Streaming** - 3-5 second delay with Amazon IVS
- **Real-time Chat** - Interactive live chat with user badges and emojis
- **Responsive Design** - Works perfectly on desktop and mobile
- **Auto-Recovery** - Smart error handling and stream recovery
- **Live Status Indicators** - Visual feedback for stream status

## 📁 Project Structure

```
gg-hub/
├── src/
│   ├── components/
│   │   ├── IVSPlayer.jsx      # Amazon IVS video player component
│   │   └── LiveChat.jsx       # Real-time chat component
│   ├── CSS/                   # Styled components (global, nav, ivs, chat)
│   ├── client/
│   │   └── ivsstreamdetails.js # Your IVS channel configuration
│   └── App.jsx               # Main application
├── amplify/                  # AWS Amplify backend configuration
└── README.md                # This file
```

## 🛠️ Setup Instructions

### 1. Install Dependencies & Create Components

```bash
# Install dependencies
npm install

# Create components directory
mkdir src/components
```

### 2. Create Component Files

Create the following files with the provided code:

- `src/components/IVSPlayer.jsx` - Copy the IVS Player component
- `src/components/LiveChat.jsx` - Copy the Live Chat component  
- Replace `src/App.jsx` with the updated version

### 3. Start Development Server

```bash
npm run dev
```

## 🎥 Amazon IVS Configuration

### Your Stream Details

- **Channel ARN**: `arn:aws:ivs:us-west-2:251394915937:channel/aVHZaA2R5mCI`
- **Playback URL**: `https://6376322642cf.us-west-2.playback.live-video.net/api/video/v1/us-west-2.251394915937.channel.aVHZaA2R5mCI.m3u8`
- **Ingest Server**: `rtmps://6376322642cf.global-contribute.live-video.net:443/app/`
- **Stream Key**: `sk_us-west-2_IrhPVpWoL4fC_uuYyxsaOxiHvPpWq1EX05RBtZLZovk`

### Configure Low-Latency Mode (IMPORTANT!)

To eliminate lag and reduce latency to 3-5 seconds, update your IVS channel:

```bash
# 1. Check current channel settings
aws ivs get-channel \
    --arn "arn:aws:ivs:us-west-2:251394915937:channel/aVHZaA2R5mCI" \
    --region us-west-2

# 2. Update to LOW latency mode (this fixes the lag!)
aws ivs update-channel \
    --arn "arn:aws:ivs:us-west-2:251394915937:channel/aVHZaA2R5mCI" \
    --latency-mode "LOW" \
    --type "STANDARD" \
    --region us-west-2

# 3. Verify the change
aws ivs get-channel \
    --arn "arn:aws:ivs:us-west-2:251394915937:channel/aVHZaA2R5mCI" \
    --region us-west-2 \
    --query 'channel.{LatencyMode:latencyMode,Type:type,State:state}'
```

## 🎮 OBS Studio Setup

### Basic Configuration
1. Open OBS Studio
2. Go to **Settings → Stream**
3. Configure these settings:

```
Service: Custom
Server: rtmps://6376322642cf.global-contribute.live-video.net:443/app/
Stream Key: sk_us-west-2_IrhPVpWoL4fC_uuYyxsaOxiHvPpWq1EX05RBtZLZovk
```

### Low-Latency Output Settings
For optimal performance, configure these **Output** settings:

```
Output Mode: Advanced
Encoder: x264 (Software) or NVENC (Hardware)
Bitrate: 3000-6000 Kbps
Keyframe Interval: 2
CPU Usage Preset: veryfast
Profile: main
Tune: zerolatency
```

### Advanced Settings
Add this to **Advanced → Video → x264 Options**:
```
tune=zerolatency preset=veryfast
```

## 🔧 Troubleshooting

### High Latency (10+ seconds)
- ✅ Ensure channel is set to `"LOW"` latency mode
- ✅ Use recommended OBS settings above
- ✅ Check your upload speed (should be 2x your bitrate)

### Stream Keeps Buffering
- ✅ Lower OBS bitrate to 3000 Kbps
- ✅ Use wired internet connection
- ✅ Close other bandwidth-heavy applications

### Player Shows "Offline"
- ✅ Verify stream key is correct
- ✅ Check if stream is actually broadcasting in OBS
- ✅ Try stopping and restarting the stream

### Browser Issues
- ✅ Use Chrome or Edge for best compatibility
- ✅ Allow autoplay in browser settings
- ✅ Clear browser cache if issues persist

## 📊 Monitoring Your Stream

### Check Stream Status
```bash
# View current stream
aws ivs get-stream \
    --channel-arn "arn:aws:ivs:us-west-2:251394915937:channel/aVHZaA2R5mCI" \
    --region us-west-2

# List recent stream sessions
aws ivs list-stream-sessions \
    --channel-arn "arn:aws:ivs:us-west-2:251394915937:channel/aVHZaA2R5mCI" \
    --region us-west-2 \
    --max-results 5
```

### Stop Stuck Stream
```bash
aws ivs stop-stream \
    --channel-arn "arn:aws:ivs:us-west-2:251394915937:channel/aVHZaA2R5mCI" \
    --region us-west-2
```

## 🎯 Expected Performance

After proper configuration:
- **Latency**: 3-5 seconds (vs 15-30 seconds in normal mode)
- **Quality**: Adaptive 1080p/720p based on connection
- **Stability**: Auto-recovery from network issues
- **Chat**: Real-time interaction with <1 second delay

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Deploy with AWS Amplify
```bash
# Configure Amplify (if not already done)
npm install -g @aws-amplify/cli
amplify configure

# Deploy
amplify publish
```

## 📝 Additional Resources

- [Amazon IVS Documentation](https://docs.aws.amazon.com/ivs/)
- [OBS Studio Download](https://obsproject.com/)
- [AWS CLI Installation](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [React Documentation](https://react.dev/)

## 🎮 About GlobalGaming

GlobalGaming is an emerging esports tournament organizer providing high-quality, low-latency video streaming for competitive gaming. Our platform supports multiple languages and delivers the best viewing experience for esports fans worldwide.

---

**© GlobalGaming LLC est. 2025** - Building the future of esports streaming.