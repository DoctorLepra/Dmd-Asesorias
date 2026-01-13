import React, { useState, useEffect } from 'react';
import AIAssistant from '../AIAssistant.tsx';
import KnowledgeBaseEditor from './KnowledgeBaseEditor.tsx';
import RatingsViewer from './RatingsViewer.tsx';
import { supabase } from '../../lib/supabaseClient.ts';
import type { Profile } from '../../App.tsx';

interface AIManagerProps {
  profile: Profile;
}

// FIX: Updated prop types to be more specific ('test' | 'ratings' instead of string)
// This ensures type compatibility with the `activeTab` state and its setter function.
const TabButton: React.FC<{
  tabName: 'test' | 'ratings';
  currentTab: 'test' | 'ratings';
  setTab: (tabName: 'test' | 'ratings') => void;
  children: React.ReactNode;
}> = ({ tabName, currentTab, setTab, children }) => (
  <button
    onClick={() => setTab(tabName)}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      currentTab === tabName
        ? 'bg-[#212147] text-white'
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    {children}
  </button>
);

const AIManager: React.FC<AIManagerProps> = ({ profile }) => {
  const [isEditingKnowledge, setIsEditingKnowledge] = useState(false);
  const [activeTab, setActiveTab] = useState<'test' | 'ratings'>('test');
  const [ratingsCount, setRatingsCount] = useState(0);

  const isDevMode = profile.id === 'dev-user-id';

  useEffect(() => {
    const fetchCount = async () => {
        if (isDevMode) {
            setRatingsCount(10); // Mock count for dev mode
            return;
        }

        const { data, error } = await supabase.rpc('count_rated_conversations');
        
        if (error) {
            // FIX: Log the actual error message instead of the raw object for better debugging.
            console.error("Error fetching ratings count:", error.message || error);
        } else if (data !== null) {
            setRatingsCount(data);
        }
    };
    fetchCount();
  }, [isDevMode]);

  if (isEditingKnowledge) {
    return (
      <KnowledgeBaseEditor
        onSaveSuccess={() => setIsEditingKnowledge(false)}
        onCancel={() => setIsEditingKnowledge(false)}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Gestión del Asistente IA</h2>
          <p className="text-slate-600 mt-1">Modifica el comportamiento del asistente, pruébalo y revisa las calificaciones de los usuarios.</p>
        </div>
        <button
          onClick={() => setIsEditingKnowledge(true)}
          className="flex-shrink-0 flex items-center bg-white border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-50 transition-all"
        >
          <span className="material-symbols-outlined mr-2">edit_note</span>
          Editar Conocimiento
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-4">
        <TabButton tabName="test" currentTab={activeTab} setTab={setActiveTab}>
            Probar Asistente
        </TabButton>
        <TabButton tabName="ratings" currentTab={activeTab} setTab={setActiveTab}>
            <div className="flex items-center">
                Calificaciones
                <span className="ml-2 bg-slate-100 text-[#212147] text-xs font-bold px-2 py-0.5 rounded-full">{ratingsCount}</span>
            </div>
        </TabButton>
      </div>

      {activeTab === 'test' ? (
        <div className="p-6 border border-slate-200 rounded-xl bg-slate-50">
          <AIAssistant profile={profile} />
        </div>
      ) : (
        <RatingsViewer isDevMode={isDevMode} />
      )}
    </div>
  );
};

export default AIManager;