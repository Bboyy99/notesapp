import { useState, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import "./App.css";

function MobileNavToggle({ isOpen, onToggle }) {
  return (
    <button 
      className="mobile-nav-toggle" 
      onClick={onToggle}
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
    >
    </button>
  );
}

function RichTextEditor({ content, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor',
        placeholder: placeholder,
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-container">
      <div className="toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`}
          title="Underline"
        >
          U
        </button>
        <div className="toolbar-divider"></div>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
          title="Heading 3"
        >
          H3
        </button>
        <div className="toolbar-divider"></div>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          title="Bullet List"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          title="Numbered List"
        >
          1.
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
          title="Quote"
        >
          "
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
          title="Code Block"
        >
          &lt;/&gt;
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function App() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredNotes, setFilteredNotes] = useState([]);

  // Mobile states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      fetchNotes();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Close sidebar when note is selected on mobile
  useEffect(() => {
    if (selectedNote && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [selectedNote]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          logout();
          return;
        }
        throw new Error("Failed to fetch notes");
      }
      const data = await res.json();
      setNotes(data);
      if (data.length > 0 && !selectedNote) {
        setSelectedNote(data[0]);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      const endpoint = isRegistering ? '/register' : '/login';
      const body = isRegistering ? { email, password, name } : { email, password };
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setToken(data.token);
      setUser(data.user);
      setIsLoggedIn(true);
      localStorage.setItem('token', data.token);
      setEmail("");
      setPassword("");
      setName("");
      setSuccess(isRegistering ? "Account created successfully!" : "Welcome back!");
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    setNotes([]);
    setSelectedNote(null);
    localStorage.removeItem('token');
  };

  const createNewNote = () => {
    const tempNote = {
      id: Date.now(),
      title: "Untitled Note",
      content: "",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setSelectedNote(tempNote);
    setIsEditing(true);
    setEditTitle("Untitled Note");
    setEditContent("");
    setSearchTerm("");
    
    // Enter fullscreen mode on mobile when creating new note
    if (window.innerWidth <= 768) {
      setIsMobileFullscreen(true);
    }
  };

  const saveNewNote = async () => {
    try {
      const res = await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (!res.ok) {
        throw new Error("Failed to create note");
      }
      const newNote = await res.json();
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNote(newNote);
      setIsEditing(false);
      setIsMobileFullscreen(false);
      setSuccess("Note created successfully!");
    } catch (err) {
      setError("Error creating note.");
      console.error(err);
    }
  };

  const handleDelete = async (noteId) => {
    try {
      const res = await fetch(`${API_URL}/notes/${noteId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error("Failed to delete note");
      }
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(notes.length > 1 ? notes.find(n => n.id !== noteId) : null);
        setIsEditing(false);
        setIsMobileFullscreen(false);
      }
      setSuccess("Note deleted successfully!");
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete note");
    }
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    
    try {
      const res = await fetch(`${API_URL}/notes/${selectedNote.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (!res.ok) {
        throw new Error("Failed to update note");
      }
      const updatedNote = await res.json();
      setNotes((prev) => 
        prev.map((note) => 
          note.id === selectedNote.id ? updatedNote : note
        )
      );
      setSelectedNote(updatedNote);
      setIsEditing(false);
      setIsMobileFullscreen(false);
      setSuccess("Note saved successfully!");
    } catch (err) {
      console.error("Error updating note:", err);
      setError("Failed to save note");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsMobileFullscreen(false);
    if (selectedNote && selectedNote.id > 1000000) {
      setSelectedNote(null);
    } else {
      setEditTitle(selectedNote?.title || "");
      setEditContent(selectedNote?.content || "");
    }
  };

  const handleNoteSelect = (note) => {
    console.log('Note selected:', note); // Debug log
    setSelectedNote(note);
    setIsEditing(false);
    setIsMobileFullscreen(false);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    if (window.innerWidth <= 768) {
      setIsMobileFullscreen(true);
    }
  };

  const filterNotes = (notes, searchTerm) => {
    if (!searchTerm.trim()) return notes;
    
    return notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  useEffect(() => {
    setFilteredNotes(filterNotes(notes, searchTerm));
  }, [notes, searchTerm]);

  if (loading) return <div className="loading">Loading...</div>;

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <h1 className="auth-title">Notes</h1>
        <p className="auth-subtitle">{isRegistering ? 'Create your account' : 'Sign in to your account'}</p>
        
        <form onSubmit={handleAuth}>
          {isRegistering && (
            <div className="input-group">
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>
          )}
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
          <button 
            type="button" 
            onClick={() => setIsRegistering(!isRegistering)}
            className="btn btn-secondary btn-full"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
          </button>
        </form>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>
    );
  }

  const mainContent = (
    <div className={`main-content ${isMobileFullscreen ? 'mobile-fullscreen' : ''}`}>
      <div className="content-header">
        <div className="content-title">
          {selectedNote ? (isEditing ? 'Editing Note' : selectedNote.title) : 'Select a note'}
        </div>
        <div className="content-actions">
          {selectedNote && (
            <>
              {isEditing ? (
                <>
                  {selectedNote.id > 1000000 ? (
                    <button onClick={saveNewNote} className="btn btn-primary">Save Note</button>
                  ) : (
                    <button onClick={handleSave} className="btn btn-primary">Save</button>
                  )}
                  <button onClick={handleCancelEdit} className="btn btn-secondary">Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={handleStartEdit} className="btn btn-primary">Edit</button>
                  <button onClick={() => handleDelete(selectedNote.id)} className="btn btn-danger">Delete</button>
                </>
              )}
            </>
          )}
          <button onClick={createNewNote} className="btn btn-primary">New Note</button>
        </div>
      </div>
      
      <div className="content-body">
        {selectedNote ? (
          isEditing ? (
            <div className="note-form">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="input-field"
                placeholder="Note title"
              />
              <RichTextEditor
                content={editContent}
                onChange={setEditContent}
                placeholder="Start writing your note..."
              />
            </div>
          ) : (
            <div 
              className="note-content-display"
              dangerouslySetInnerHTML={{ __html: selectedNote.content || "This note is empty. Click Edit to add content." }}
            />
          )
        ) : (
          <div className="empty-state">
            <h3>Welcome to Notes</h3>
            <p>Select a note from the sidebar or create a new one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <MobileNavToggle 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">Notes</div>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="user-info">
            <span>{user?.name || user?.email}</span>
            <button onClick={logout} className="logout-btn">Sign Out</button>
          </div>
        </div>
        
        <div className="notes-list">
          {filteredNotes.length === 0 ? (
            <div className="empty-state">
              <h3>{searchTerm ? 'No matching notes' : 'No notes yet'}</h3>
              <p>{searchTerm ? 'Try a different search term' : 'Create your first note to get started'}</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div 
                key={note.id} 
                className={`note-item-sidebar ${selectedNote?.id === note.id ? 'active' : ''}`}
                onClick={() => handleNoteSelect(note)}
              >
                <div className="note-title-sidebar">{note.title}</div>
                <div className="note-preview">{note.content.replace(/<[^>]*>/g, '')}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      {mainContent}
    </div>
  );
}

export default App;