import CommentsSheet, { type Comment } from '@/components/lib/CommentsSheet';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

describe('CommentsSheet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  const sampleComments: Comment[] = [
    {
      id: 'c1',
      userId: 'u1',
      userName: 'Jane',
      text: 'Nice video',
      timestamp: new Date('2025-01-01T00:00:00.000Z'),
      likes: 0,
      isLiked: false,
    },
  ];

  it('renders comments and supports liking a comment', () => {
    const onLikeComment = jest.fn();
    const { getByText, getByLabelText } = render(
      <CommentsSheet
        visible
        onClose={jest.fn()}
        comments={sampleComments}
        onAddComment={jest.fn()}
        onLikeComment={onLikeComment}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(getByText('1 Comments')).toBeTruthy();
    fireEvent.press(getByLabelText('Like comment by Jane'));
    expect(onLikeComment).toHaveBeenCalledWith('c1');
  });

  it('adds a new comment from input', () => {
    const onAddComment = jest.fn();
    const { getByLabelText } = render(
      <CommentsSheet
        visible
        onClose={jest.fn()}
        comments={sampleComments}
        onAddComment={onAddComment}
        onLikeComment={jest.fn()}
      />
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    fireEvent.changeText(getByLabelText('Comment input'), '  hello there  ');
    fireEvent.press(getByLabelText('Send comment'));

    expect(onAddComment).toHaveBeenCalledWith('hello there');
  });
});
