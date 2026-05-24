import React, { useState } from 'react';
import { Plus, X, BookOpen } from 'lucide-react';

const STORAGE_KEY = 'mirla_notes_tab';
const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };
const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const fmt = (ts) => new Date(ts).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

const NotesTab = () => {
  const [notes, setNotes]     = useState(load);
  const [expanded, setExpanded] = useState(null);
  const [newNote, setNewNote] = useState('');

  const addNote = () => {
    if (!newNote.trim()) return;
    const updated = [{ text: newNote.trim(), date: Date.now(), id: Date.now() }, ...notes];
    setNotes(updated); save(updated);
    setNewNote('');
  };

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated); save(updated);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 border border-amber-200 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(254,252,232,0.3) 100%)'
      }}>
        <h2 className="text-3xl font-light text-amber-900 mb-2 flex items-center gap-3">
          <BookOpen className="text-amber-500" size={28} /> Your Thoughts
        </h2>
        <p className="text-amber-500 text-sm font-light italic mb-6">"No one else sees it. Just you and your journey." 💛</p>

        <div className="space-y-3 mb-8 pb-8 border-b border-amber-200">
          <textarea
            placeholder="Write whatever is on your heart..."
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && e.ctrlKey && addNote()}
            className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 h-28 resize-none"
          />
          <button onClick={addNote}
            className="w-full px-4 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 transition-all shadow-sm flex items-center justify-center gap-2">
            <Plus size={18} /> Save Note
          </button>
        </div>

        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-amber-600 font-light italic">Your private notes will appear here.</p>
          ) : notes.map(note => (
            <div key={note.id} className="rounded-2xl p-4 bg-white bg-opacity-40 border border-amber-200">
              <button onClick={() => setExpanded(expanded === note.id ? null : note.id)}
                className="w-full text-left">
                <p className="text-xs text-amber-400 mb-1">{fmt(note.date)}</p>
                <p className="text-amber-900 text-sm line-clamp-2">{note.text}</p>
              </button>
              {expanded === note.id && (
                <div className="mt-3 pt-3 border-t border-amber-100">
                  <p className="text-sm text-amber-900 font-light whitespace-pre-wrap">{note.text}</p>
                  <button onClick={() => deleteNote(note.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-3">
                    <X size={13} /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotesTab;
