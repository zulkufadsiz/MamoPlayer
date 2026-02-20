import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: Date;
  likes: number;
  isLiked?: boolean;
}

interface CommentsSheetProps {
  visible: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (text: string) => void;
  onLikeComment: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  totalComments?: number;
}

export default function CommentsSheet({
  visible,
  onClose,
  comments,
  onAddComment,
  onLikeComment,
  onDeleteComment: _onDeleteComment,
  totalComments,
}: CommentsSheetProps) {
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleSendComment = () => {
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText('');
      setReplyingTo(null);
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        <Ionicons name="person" size={20} color="#666" />
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.commentAction}
            onPress={() => setReplyingTo(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Reply to ${item.userName}`}
            hitSlop={10}
          >
            <Text style={styles.commentActionText}>Reply</Text>
          </TouchableOpacity>
          {item.likes > 0 && <Text style={styles.likesCount}>{formatCount(item.likes)} likes</Text>}
        </View>
      </View>
      <TouchableOpacity
        style={styles.likeButton}
        onPress={() => onLikeComment(item.id)}
        accessibilityRole="button"
        accessibilityLabel={
          item.isLiked ? `Unlike comment by ${item.userName}` : `Like comment by ${item.userName}`
        }
        hitSlop={10}
      >
        <Ionicons
          name={item.isLiked ? 'heart' : 'heart-outline'}
          size={16}
          color={item.isLiked ? '#FF0050' : '#666'}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close comments"
        accessibilityHint="Closes the comments panel"
      >
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <Text style={styles.headerTitle}>{totalComments || comments.length} Comments</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close comments"
              hitSlop={10}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentsList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No comments yet</Text>
                <Text style={styles.emptySubtext}>Be the first to comment!</Text>
              </View>
            }
          />

          {/* Input Section */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            {replyingTo && (
              <View style={styles.replyingBar}>
                <Text style={styles.replyingText}>
                  Replying to {comments.find((c) => c.id === replyingTo)?.userName}
                </Text>
                <TouchableOpacity
                  onPress={() => setReplyingTo(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel reply"
                  hitSlop={10}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputContainer}>
              <View style={styles.inputAvatar}>
                <Ionicons name="person" size={20} color="#999" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
                accessibilityLabel="Comment input"
                accessibilityHint="Type your comment"
              />
              <TouchableOpacity
                style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                onPress={handleSendComment}
                disabled={!commentText.trim()}
                accessibilityRole="button"
                accessibilityLabel="Send comment"
                accessibilityHint="Posts your comment"
                accessibilityState={{ disabled: !commentText.trim() }}
              >
                <Ionicons name="send" size={20} color={commentText.trim() ? '#007AFF' : '#ccc'} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  dragHandle: {
    position: 'absolute',
    top: 8,
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsList: {
    paddingVertical: 8,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
    gap: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  commentAction: {
    paddingVertical: 2,
    minHeight: 32,
    justifyContent: 'center',
  },
  commentActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  likesCount: {
    fontSize: 12,
    color: '#999',
  },
  likeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  replyingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  replyingText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
