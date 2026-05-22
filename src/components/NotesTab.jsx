import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

const NotesTab = ({ db }) => {
  const [notes, setNotes] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (!db) return;
    const tx = db.transaction('notes', 'readonly');
    const store = tx.objectStore('notes');
    const request = store.getAll();
    request.onsuccess = () => setNotes(request.result.sort((a, b) => b.date - a.date));
  }, [db]);

  const addNote = () => {
    if (!newNote.trim()) return;
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    const note = { text: newNote, date: Date.now(), id: Date.now() };
    store.add(note);
    setNotes([note, ...notes]);
    setNewNote('');
  };

  const deleteNote = (id) => {
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    store.delete(id);
    setNotes(notes.filter(n => n.id !== id));
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(254, 252, 232, 0.3) 100%)'
      }}>
        <h2 className="text-3xl font-light text-amber-900 mb-6">Your Thoughts</h2>

        <div className="space-y-3 mb-8 pb-8 border-b border-amber-200">
          <textarea
            placeholder="Write whatever is on your heart..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-24 resize-none"
          />
          <button onClick={addNote} className="w-full px-4 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center justify-center gap-2">
            <Plus size={18} /> Save Note
          </button>
        </div>

        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-amber-700 font-light">Your private notes will appear here.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-2xl p-4 bg-white bg-opacity-40 border border-amber-200">
                <button onClick={() => setExpanded(expanded === note.id ? null : note.id)} className="w-full text-left">
                  <p className="text-sm text-amber-600 font-light mb-1">{formatDate(note.date)}</p>
                  <p className="text-amber-900 line-clamp-2 text-sm">{note.text}</p>
                </button>
                {expanded === note.id && (
                  <div className="mt-4 pt-4 border-t border-amber-200 space-y-2">
                    <p className="text-sm text-amber-900 whitespace-pre-wrap">{note.text}</p>
                    <button onClick={() => deleteNote(note.id)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mt-3">
                      <X size={16} /> Remove
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesTab;
