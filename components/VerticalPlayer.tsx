
import { Ionicons } from '@expo/vector-icons';
import { useEventListener } from 'expo';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import CommentsSheet, { type Comment } from './lib/CommentsSheet';
import SettingsDialog from './lib/SettingsDialog';

interface Subtitle {
  start: number;
  end: number;
  text: string;
}

interface VerticalPlayerProps {
  source: VideoSource;
  style?: any;
  autoPlay?: boolean;
  contentFit?: 'contain' | 'cover' | 'fill';
  onPlayingChange?: (isPlaying: boolean) => void;
  subtitles?: Subtitle[];
  onSettingsPress?: () => void;
  title?: string;
  description?: string;
  author?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

const videoSource =
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';

export const VerticalPlayer: React.FC<VerticalPlayerProps> = ({ 
  source, 
  autoPlay = true,
  subtitles = [], 
  onSettingsPress,
  title,
  description,
  author = 'User',
  likes = 0,
  comments = 0,
  shares = 0,
  onLike,
  onComment,
  onShare,
  onSwipeUp,
  onSwipeDown,
}) => {
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.volume = 1;
  });
  const { width, height } = useWindowDimensions();

  useEventListener(player, 'statusChange', ({ status, error }) => {
    console.log('Player status changed: ', status);
    if (status === 'readyToPlay' && autoPlay) {
      player.play();
    }
  });

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [showControls, setShowControls] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<Comment[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'JohnDoe',
      text: 'This is amazing! Love it! 😍',
      timestamp: new Date(Date.now() - 3600000),
      likes: 24,
      isLiked: false,
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'SarahSmith',
      text: 'Great video, thanks for sharing!',
      timestamp: new Date(Date.now() - 7200000),
      likes: 15,
      isLiked: false,
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'MikeBrown',
      text: 'Can\'t wait for more content like this 🔥',
      timestamp: new Date(Date.now() - 86400000),
      likes: 42,
      isLiked: true,
    },
  ]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(autoPlay);
  const [isLiked, setIsLiked] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [controlsOpacity] = useState(new Animated.Value(1));

  // Track current subtitle
  useEffect(() => {
    if (!player || subtitles.length === 0) return;

    const interval = setInterval(() => {
      const currentTime = player.currentTime || 0;
      const subtitle = subtitles.find(
        (sub) => currentTime >= sub.start && currentTime <= sub.end
      );
      setCurrentSubtitle(subtitle ? subtitle.text : '');
    }, 100);

    return () => clearInterval(interval);
  }, [player, subtitles]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      const timer = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying]);

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const handleScreenPress = () => {
    if (!showControls) {
      setShowControls(true);
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      handlePlayPause();
    }
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (player) {
      player.playbackRate = speed;
    }
  };

  const handleSettingsPress = () => {
    setShowSettings(true);
    if (onSettingsPress) {
      onSettingsPress();
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (onLike) {
      onLike();
    }
  };

  const handleCommentsPress = () => {
    setShowComments(true);
    if (onComment) {
      onComment();
    }
  };

  const handleAddComment = (text: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: 'currentUser',
      userName: 'You',
      text,
      timestamp: new Date(),
      likes: 0,
      isLiked: false,
    };
    setCommentsList([newComment, ...commentsList]);
  };

  const handleLikeComment = (commentId: string) => {
    setCommentsList(
      commentsList.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment
      )
    );
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };
  return (
    <View style={styles.contentContainer}>
      <StatusBar hidden />
      
      {/* Video Background */}
      <VideoView 
        style={styles.video} 
        player={player} 
        nativeControls={false} 
        contentFit="cover"
      />

      {/* Gradient Overlays */}
      <View style={styles.topGradient} />
      <View style={styles.bottomGradient} />

      {/* Main Touch Area for Play/Pause */}
      <Pressable 
        style={styles.touchArea}
        onPress={handleScreenPress}
      >
        {/* Center Play/Pause Icon */}
        {showControls && (
          <Animated.View style={[styles.centerPlayPause, { opacity: controlsOpacity }]}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={80}
              color="rgba(255, 255, 255, 0.9)"
            />
          </Animated.View>
        )}
      </Pressable>

      {/* Right Side Action Buttons */}
      <View style={styles.rightActions}>
        {/* Author Avatar */}
        <TouchableOpacity style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
          <View style={styles.followButton}>
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Like Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons 
            name={isLiked ? 'heart' : 'heart-outline'} 
            size={32} 
            color={isLiked ? '#FF0050' : '#fff'} 
          />
          <Text style={styles.actionText}>{formatCount(likes + (isLiked ? 1 : 0))}</Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleCommentsPress}>
          <Ionicons name="chatbubble-outline" size={32} color="#fff" />
          <Text style={styles.actionText}>{formatCount(comments + commentsList.length)}</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons name="arrow-redo-outline" size={32} color="#fff" />
          <Text style={styles.actionText}>{formatCount(shares)}</Text>
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleSettingsPress}>
          <Ionicons name="ellipsis-horizontal" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Section */}
      <View style={styles.bottomInfo}>
        {/* Author Info */}
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>@{author}</Text>
          {title && <Text style={styles.title}>{title}</Text>}
          {description && <Text style={styles.description} numberOfLines={2}>{description}</Text>}
        </View>
      </View>

      {/* Subtitle Display */}
      {showSubtitles && currentSubtitle && (
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitleText}>{currentSubtitle}</Text>
        </View>
      )}
      
      <SettingsDialog
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={handlePlaybackSpeedChange}
        quality={quality}
        onQualityChange={setQuality}
        autoPlay={autoPlayEnabled}
        onAutoPlayChange={setAutoPlayEnabled}
        showSubtitles={showSubtitles}
        onShowSubtitlesChange={setShowSubtitles}
      />

      <CommentsSheet
        visible={showComments}
        onClose={() => setShowComments(false)}
        comments={commentsList}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
        totalComments={comments + commentsList.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  centerPlayPause: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 140,
    alignItems: 'center',
    gap: 24,
    zIndex: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF0050',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -12,
    borderWidth: 2,
    borderColor: '#000',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 100,
    paddingHorizontal: 16,
    paddingBottom: 80,
    zIndex: 3,
  },
  authorInfo: {
    gap: 8,
  },
  authorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitleContainer: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    right: 100,
    alignItems: 'center',
    zIndex: 4,
  },
  subtitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
});

export default VerticalPlayer;
