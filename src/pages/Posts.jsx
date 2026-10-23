import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import PostForm from '../components/PostForm';
import { Alert, Badge, Button, EmptyState, PageHeader } from '../components/ui';
import { inputClass } from '../utils/styles';

// One post with its comments and buttons
function PostItem({ post, onChanged }) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const isHr = user.role === 'hr';
  const canDelete = isHr || post.author._id === user._id;

  // Every button does the same thing: call the API, then ask the page to reload
  const run = async (path, options) => {
    try {
      await api(path, options);
      setError('');
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    await run(`/posts/${post._id}/comments`, { method: 'POST', body: { text: comment } });
    setComment('');
  };

  return (
    <article className="mb-4 rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-blue-950">{post.title}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-blue-900/60">
            {post.isPinned && <Badge tone="amber">Pinned</Badge>}
            <Badge tone={post.audience === 'company' ? 'blue' : 'gray'}>
              {post.audience === 'company' ? 'Whole company' : 'Team'}
            </Badge>
            <span>
              {post.author.email} · {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          {isHr && (
            <Button variant="secondary" size="sm" onClick={() => run(`/posts/${post._id}/pin`, { method: 'PATCH' })}>
              {post.isPinned ? 'Unpin' : 'Pin'}
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" size="sm" onClick={() => run(`/posts/${post._id}`, { method: 'DELETE' })}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm text-blue-900">{post.body}</p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 border-t border-blue-100 pt-4">
        <h4 className="mb-2 text-sm font-semibold text-blue-900">Comments ({post.comments.length})</h4>
        <ul className="mb-3 space-y-2">
          {post.comments.map((c) => (
            <li key={c._id} className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
              <b className="font-medium text-blue-950">{c.userId?.email}</b>: {c.text}
            </li>
          ))}
        </ul>
        <form onSubmit={handleComment} className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment"
            aria-label="Comment"
            className={inputClass}
          />
          <Button type="submit" variant="secondary">Comment</Button>
        </form>
      </div>
    </article>
  );
}

function Posts() {
  const { user } = useAuth();
  const canPost = user.role === 'manager' || user.role === 'hr';

  const [posts, setPosts] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/posts')
      .then((data) => {
        setPosts(data.posts);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  return (
    <div>
      <PageHeader title="Bulletin board" subtitle="Announcements for the company and for your team." />
      {error && <Alert>{error}</Alert>}

      {canPost && <PostForm onCreated={reload} />}

      {posts.length === 0 && <EmptyState>No posts yet.</EmptyState>}
      {posts.map((post) => (
        <PostItem key={post._id} post={post} onChanged={reload} />
      ))}
    </div>
  );
}

export default Posts;
