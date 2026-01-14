import React, { useState, useRef, useEffect, useCallback } from 'react';
import { geminiService } from '../services/geminiService.ts';
import { marked } from 'marked';
import { supabase } from '../lib/supabaseClient.ts';
import type { Profile } from '../App.tsx';
import { Modality, type Blob } from '@google/genai';
import ConfirmModal from './common/ConfirmModal.tsx';


// --- INTERFACES ---

interface AIAssistantProps {
  profile: Profile;
}

interface ImageState {
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  imagePreview?: string;
  isPartial?: boolean;
}

interface Conversation {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
  status: 'active' | 'closed';
  rating?: number | null;
  feedback?: string | null;
}

// --- AUDIO HELPERS ---

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}


// --- SUB-COMPONENTS ---

const UserMessage: React.FC<{ message: Message }> = ({ message }) => (
  <div className={`flex justify-end items-start gap-3 ${message.isPartial ? 'opacity-70' : ''}`}>
    <div className="bg-[#212147] text-white p-3 rounded-xl max-w-lg">
      {message.imagePreview && <img src={message.imagePreview} alt="Adjunto por usuario" className="rounded-lg mb-2 max-w-xs" />}
      <p className="text-sm">{message.text}</p>
    </div>
    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm flex-shrink-0">
      <span className="material-symbols-outlined">person</span>
    </div>
  </div>
);

const AIMessage: React.FC<{ message: Message }> = ({ message }) => {
  const showSupportButton = message.text.includes('[SUPPORT_BUTTON]');
  const cleanedText = message.text.replace('[SUPPORT_BUTTON]', '').trim();

  return (
      <div className={`flex items-start gap-3 ${message.isPartial ? 'opacity-70' : ''}`}>
          <img 
            src="https://yxlhgmilucfgooprmeha.supabase.co/storage/v1/object/public/public_assets/Recurso%2013.png" 
            alt="Avatar de Asistente IA" 
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div className="bg-slate-100 text-slate-800 p-3 rounded-xl max-w-lg">
              <div
                  className="prose prose-slate prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked.parse(cleanedText) as string }}
              />
              {showSupportButton && !message.isPartial && (
                  <a
                      href="https://www.contapyme.com/portal-clientes/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center justify-center bg-[#212147] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#1b1b3a] transition-all text-sm no-underline"
                  >
                      <span className="material-symbols-outlined mr-2 text-base">support_agent</span>
                      Solicitar soporte técnico
                  </a>
              )}
          </div>
      </div>
  );
};

const RatingView: React.FC<{ conversationId: string; onRated: () => void; isDevMode: boolean }> = ({ conversationId, onRated, isDevMode }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    if (isDevMode) {
        setTimeout(() => {
            alert('¡Gracias por tu calificación! (Modo Desarrollo: No guardado en BD)');
            onRated();
            setIsSubmitting(false);
        }, 500);
        return;
    }

    const { error } = await supabase
      .from('ai_conversations')
      .update({ rating, feedback, status: 'closed' })
      .eq('id', conversationId);
    
    if (error) {
      alert('Error al enviar la calificación.');
      console.error(error);
    } else {
      alert('¡Gracias por tu calificación!');
      onRated();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="border-t border-slate-200 p-4 bg-slate-50 text-center">
      <h4 className="font-bold text-slate-700">Califica esta conversación</h4>
      <div className="flex justify-center my-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className={`text-3xl transition-colors ${
              (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-slate-300'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${ (hoverRating || rating) >= star ? 1 : 0 }`}}>
              star
            </span>
          </button>
        ))}
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Déjanos un comentario adicional (opcional)"
        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white text-black placeholder-slate-500"
        rows={2}
      />
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        className="mt-2 w-full bg-[#212147] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#1b1b3a] disabled:bg-slate-400"
      >
        {isSubmitting ? 'Enviando...' : 'Enviar Calificación'}
      </button>
    </div>
  );
};


// --- MAIN COMPONENT ---

const AIAssistant: React.FC<AIAssistantProps> = ({ profile }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [currentMessage, setCurrentMessage] = useState('');
  const [attachedImage, setAttachedImage] = useState<ImageState | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioSources = useRef(new Set<AudioBufferSourceNode>());
  const nextAudioStartTime = useRef(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');
  
  const isDevMode = profile.id === 'dev-user-id';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, chatLoading, liveTranscription]);

  const fetchConversations = useCallback(async () => {
    // DEV MODE BYPASS
    if (isDevMode) {
        setConversations([
            {
                id: 'dev-convo-1',
                user_id: 'dev-user-id',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                messages: [{ sender: 'ai', text: 'Bienvenido al modo de prueba. Las conversaciones aquí son simuladas y no se guardan en la base de datos.' }],
                status: 'active'
            }
        ]);
        return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', profile.id)
      .gte('updated_at', thirtyDaysAgo)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      setError('No se pudieron cargar las conversaciones. Es posible que la tabla "ai_conversations" no esté configurada. Ver las notas en el código.');
    } else {
      setConversations(data as Conversation[]);
    }
  }, [profile.id, isDevMode]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  
  // Cleanup effect for audio session
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.close();
      }
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
    };
  }, []);

  const handleStartNewChat = () => {
    setActiveConversation({
      id: 'new',
      user_id: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [{ sender: 'ai', text: '¡Hola! Soy tu asistente de IA. Describe tu problema con Contapyme o Agrowin.' }],
      status: 'active',
    });
  };

  const handleSelectConversation = (conversation: Conversation) => {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const lastUpdate = new Date(conversation.updated_at);

    if (lastUpdate < fourHoursAgo && conversation.status === 'active') {
      const timedOutConversation = { ...conversation, status: 'closed' as 'closed' };
       setActiveConversation(timedOutConversation);
       if (!isDevMode) {
           supabase.from('ai_conversations').update({ status: 'closed' }).eq('id', conversation.id).then();
       }
    } else {
      setActiveConversation(conversation);
    }
  };
  
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Por favor, sube un archivo de imagen (JPG o PNG).');
      return;
    }

    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      alert('El archivo es demasiado grande. El tamaño máximo es 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      const base64 = preview.split(',')[1];
      setAttachedImage({ file, preview, base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleFileChange(file);
          break;
        }
      }
    }
  };

  const saveConversation = async (messages: Message[], currentId: string): Promise<string | null> => {
     if (isDevMode) {
         console.log("DEV_MODE: Simulation saving conversation", messages);
         return currentId === 'new' ? `dev-convo-${Date.now()}` : currentId;
     }

     if (currentId === 'new') {
        const { data, error: insertError } = await supabase
            .from('ai_conversations')
            .insert({ user_id: profile.id, messages, status: 'active' })
            .select()
            .single();

        if (insertError) {
            setError('No se pudo guardar la conversación.');
            console.error(insertError);
            return null;
        }
        fetchConversations(); // Refresh list in background
        return data.id;
    } else {
        const { error: updateError } = await supabase
            .from('ai_conversations')
            .update({ messages: messages })
            .eq('id', currentId);
        
        if (updateError) {
            setError('No se pudo actualizar la conversación.');
            console.error(updateError);
        }
        return currentId;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || chatLoading) return;

    const messageText = currentMessage.trim();
    if (!messageText && !attachedImage) return;

    setChatLoading(true);

    const userMessage: Message = {
      sender: 'user',
      text: messageText,
      imagePreview: attachedImage?.preview,
    };

    const imageForRequest = attachedImage ? { base64: attachedImage.base64, mimeType: attachedImage.mimeType } : undefined;

    setCurrentMessage('');
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Create a local copy of messages with the user's message appended
    // This is crucial for saving the correct state later
    let conversationWithUserMsg = {
        ...activeConversation,
        messages: [...activeConversation.messages, userMessage],
    };

    let currentId = activeConversation.id;

    // First save: Persist the user message
    if (currentId === 'new') {
        const newId = await saveConversation(conversationWithUserMsg.messages, 'new');
        if (newId) {
            currentId = newId;
            conversationWithUserMsg.id = newId;
            // No need to call fetchConversations here, it's called inside saveConversation
        } else {
            setChatLoading(false);
            return; // Stop if saving failed
        }
    } else {
        await saveConversation(conversationWithUserMsg.messages, currentId);
    }
    
    // Optimistic UI update: Add user message + Thinking placeholder
    const thinkingMessage: Message = { sender: 'ai', text: 'Pensando...', isPartial: true };
    const conversationWithThinking = {
        ...conversationWithUserMsg,
        messages: [...conversationWithUserMsg.messages, thinkingMessage]
    };
    setActiveConversation(conversationWithThinking);

    try {
        let fullResponse = '';
        const stream = geminiService.getSolutionStream(messageText, imageForRequest);

        for await (const chunk of stream) {
            fullResponse += chunk;
            setActiveConversation((prev: Conversation | null) => {
                if (!prev) return null;
                const newMessages = [...prev.messages];
                newMessages[newMessages.length - 1] = { 
                    ...newMessages[newMessages.length - 1], 
                    text: fullResponse 
                };
                return { ...prev, messages: newMessages };
            });
        }

        // Final save: Persist the complete conversation with AI response
        // Use the local messages copy + full response to ensure correctness
        const finalMessages: Message[] = [
            ...conversationWithUserMsg.messages,
            { sender: 'ai', text: fullResponse, isPartial: false }
        ];

        // Update UI to final state
        setActiveConversation((prev) => prev ? { ...prev, messages: finalMessages } : null);

        // Save to DB
        await saveConversation(finalMessages, currentId);

    } catch (error) {
        console.error("Error streaming response:", error);
        setActiveConversation((prev: Conversation | null) => {
            if (!prev) return null;
            const newMessages = [...prev.messages];
            newMessages[newMessages.length - 1].text = "Lo sentimos, ha ocurrido un error al generar la respuesta.";
            newMessages[newMessages.length - 1].isPartial = false;
            return { ...prev, messages: newMessages };
        });
    } finally {
        setChatLoading(false);
    }
  };


  const stopRecording = useCallback(() => {
    if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
    }
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    inputAudioContextRef.current?.close();
    if(scriptProcessorRef.current) {
       scriptProcessorRef.current.disconnect();
    }
    setIsRecording(false);
    setLiveTranscription('');
  }, []);
  
  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    if (!activeConversation) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setIsRecording(true);

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        const sessionPromise = geminiService.startChatSession({
            onopen: () => {
                const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = scriptProcessor;
                
                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromise.then((session) => {
                      session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContextRef.current!.destination);
            },
            onmessage: async (message) => {
                if(message.serverContent?.inputTranscription) {
                  const text = message.serverContent.inputTranscription.text;
                  currentInputTranscription.current += text;
                  setLiveTranscription(currentInputTranscription.current);
                }

                if (message.serverContent?.outputTranscription) {
                  const text = message.serverContent.outputTranscription.text;
                  currentOutputTranscription.current += text;
                  setActiveConversation((prev: Conversation | null) => {
                      if (!prev) return null;
                      const lastMessage = prev.messages[prev.messages.length - 1];
                      if(lastMessage?.sender === 'ai' && lastMessage?.isPartial) {
                          const newMessages = [...prev.messages];
                          newMessages[newMessages.length - 1] = { ...lastMessage, text: currentOutputTranscription.current };
                          return { ...prev, messages: newMessages };
                      }
                      return { ...prev, messages: [...prev.messages, { sender: 'ai', text: currentOutputTranscription.current, isPartial: true }]};
                  });
                }

                // FIX: Added optional chaining to 'parts' and 'inlineData' to prevent "Object is possibly undefined" error
                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio) {
                    const outCtx = outputAudioContextRef.current!;
                    nextAudioStartTime.current = Math.max(nextAudioStartTime.current, outCtx.currentTime);
                    
                    const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
                    const source = outCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outCtx.destination);
                    source.addEventListener('ended', () => audioSources.current.delete(source));

                    source.start(nextAudioStartTime.current);
                    nextAudioStartTime.current += audioBuffer.duration;
                    audioSources.current.add(source);
                }
                
                if (message.serverContent?.turnComplete) {
                   const finalInput = currentInputTranscription.current;
                   const finalOutput = currentOutputTranscription.current;
                   
                   currentInputTranscription.current = '';
                   currentOutputTranscription.current = '';
                   setLiveTranscription('');

                   setActiveConversation((prev: Conversation | null) => {
                       if (!prev) return null;
                       const finalMessages: Message[] = [
                           ...prev.messages.filter(m => !m.isPartial),
                           { sender: 'user', text: finalInput },
                           { sender: 'ai', text: finalOutput }
                       ];

                       saveConversation(finalMessages, prev.id).then(newId => {
                         if (newId) {
                            setActiveConversation(current => current ? { ...current, id: newId, messages: finalMessages } : null);
                         }
                       });
                       
                       return { ...prev, messages: finalMessages };
                   });
                }
            },
            onclose: () => {
                stopRecording();
            },
            onerror: (e) => {
                console.error("Session error:", e);
                setError("Ocurrió un error en la sesión de voz.");
                stopRecording();
            }
        });
        
        sessionRef.current = await sessionPromise;

    } catch (err) {
        console.error("Error starting voice chat:", err);
        setError("No se pudo iniciar el chat de voz. Asegúrate de permitir el acceso al micrófono.");
        setIsRecording(false);
    }
  };
  
  
  const handleEndChat = async () => {
    if (!activeConversation || activeConversation.id === 'new') return;
    
    if (isDevMode) {
        setActiveConversation({ ...activeConversation, status: 'closed' });
        // fetchConversations will be called by UI update implicitly or we can skip it
        return;
    }

    const { error } = await supabase
      .from('ai_conversations')
      .update({ status: 'closed' })
      .eq('id', activeConversation.id);

    if (error) {
      alert('Error al cerrar el chat.');
    } else {
      setActiveConversation({ ...activeConversation, status: 'closed' });
      fetchConversations(); // Refresh list
    }
  };

  const handleOpenDeleteConfirm = (convo: Conversation) => {
    setConversationToDelete(convo);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
      if (!conversationToDelete) return;
      setIsDeleting(true);

      if (isDevMode) {
          setTimeout(() => {
              setIsDeleting(false);
              setIsConfirmDeleteOpen(false);
              setConversationToDelete(null);
              fetchConversations(); // Re-render logic handles mock list
          }, 500);
          return;
      }

      const { error } = await supabase
          .from('ai_conversations')
          .delete()
          .eq('id', conversationToDelete.id);

      if (error) {
          alert('Error al eliminar la conversación.');
          console.error("Delete error:", error);
      }

      setIsDeleting(false);
      setIsConfirmDeleteOpen(false);
      setConversationToDelete(null);
      fetchConversations(); // Refresh the list
  };
  
  // --- RENDER LOGIC ---

  if (!activeConversation) {
    // Conversation List View
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Historial de Chats</h2>
            <button onClick={handleStartNewChat} className="flex items-center bg-[#212147] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#1b1b3a] transition-all">
                <span className="material-symbols-outlined mr-2">add</span>
                Iniciar Nuevo Chat
            </button>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <ul className="space-y-3">
          {conversations.length > 0 ? conversations.map(convo => (
            <li key={convo.id}>
              <div className="flex items-center gap-2 w-full">
                  <button 
                      onClick={() => handleSelectConversation(convo)} 
                      className="flex-grow text-left p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-[#212147] transition-colors duration-200 min-w-0 shadow-sm"
                  >
                      <div className="flex justify-between items-center mb-1">
                          <p className="font-semibold text-slate-800 truncate pr-4 flex-1 min-w-0">
                              {convo.messages.find(m => m.sender === 'user')?.text || 'Chat iniciado'}
                          </p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${convo.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                              {convo.status === 'active' ? 'Activo' : 'Cerrado'}
                          </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                          Última actividad: {new Date(convo.updated_at).toLocaleString()}
                      </p>
                  </button>
                  {convo.status === 'closed' && (
                      <button
                          onClick={(e) => { e.stopPropagation(); handleOpenDeleteConfirm(convo); }}
                          className="flex-shrink-0 p-3 text-red-500 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-500 transition-colors shadow-sm"
                          aria-label={`Eliminar conversación "${convo.messages.find(m => m.sender === 'user')?.text || 'Chat'}"`}
                      >
                          <span className="material-symbols-outlined">delete</span>
                      </button>
                  )}
              </div>
            </li>
          )) : (
            <div className="text-center py-8 text-slate-500">
                <span className="material-symbols-outlined text-4xl">chat</span>
                <p className="mt-2">No tienes conversaciones recientes.</p>
            </div>
          )}
        </ul>
        <ConfirmModal
            isOpen={isConfirmDeleteOpen}
            onClose={() => setIsConfirmDeleteOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Confirmar Eliminación"
            message={
                <>
                    ¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer.
                </>
            }
            isLoading={isDeleting}
        />
      </div>
    );
  }

  // Chat View
  const isChatClosed = activeConversation.status === 'closed';
  const needsRating = isChatClosed && !activeConversation.rating;

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <button onClick={() => setActiveConversation(null)} className="flex items-center text-sm font-medium text-slate-600 hover:text-[#212147]">
          <span className="material-symbols-outlined mr-1">arrow_back</span>
          Volver al historial
        </button>
        {activeConversation.id !== 'new' && !isChatClosed && (
          <button onClick={handleEndChat} className="text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors">
            Finalizar y Calificar
          </button>
        )}
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
          {activeConversation.messages.map((msg, index) => (
              msg.sender === 'user'
              ? <UserMessage key={index} message={msg} />
              : <AIMessage key={index} message={msg} />
          ))}
          <div ref={chatEndRef} />
      </div>

      {needsRating ? (
        <RatingView conversationId={activeConversation.id} onRated={() => {
          fetchConversations();
          setActiveConversation(null);
        }} isDevMode={isDevMode}/>
      ) : (
         <div className="border-t border-slate-200 p-4 bg-white">
             {isChatClosed && <p className="text-center text-sm text-slate-500 mb-2">Esta conversación ha finalizado.</p>}
              
             {attachedImage && (
              <div className="relative w-24 h-24 mb-2 group">
                <img src={attachedImage.preview} alt="Vista previa" className="w-full h-full object-cover rounded-lg border border-slate-300" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-black bg-opacity-60 text-white rounded-full p-0.5 hover:bg-opacity-80 transition-opacity focus:outline-none"
                  aria-label="Eliminar imagen"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            )}
            
            {isRecording && (
                <div className="text-center text-sm text-slate-600 mb-2 p-2 bg-slate-100 rounded-lg">
                    <p>Escuchando...</p>
                    {liveTranscription && <p className="italic mt-1">"{liveTranscription}"</p>}
                </div>
            )}

              <form onSubmit={handleSubmit}>
                  <div className="flex items-end gap-2 border border-slate-300 rounded-lg p-2 bg-slate-50">
                      <textarea
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          onPaste={handlePaste}
                          placeholder={isChatClosed ? "Conversación cerrada" : "Escribe o pega una imagen..."}
                          className="w-full p-1 border-none focus:ring-0 resize-none bg-transparent"
                          rows={1}
                          disabled={chatLoading || isChatClosed || isRecording}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSubmit(e as any);
                              }
                          }}
                      />
                       <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                          className="hidden"
                          accept="image/png, image/jpeg"
                          disabled={chatLoading || isChatClosed || isRecording}
                      />
                      <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={chatLoading || isChatClosed || isRecording}
                          className="p-2 text-slate-500 rounded-full hover:bg-slate-200 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed"
                          aria-label="Adjuntar imagen"
                      >
                          <span className="material-symbols-outlined">attach_file</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleRecording}
                        disabled={chatLoading || isChatClosed}
                        className={`p-2 rounded-full transition-colors disabled:text-slate-300 disabled:cursor-not-allowed ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:bg-slate-200'}`}
                        aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación'}
                      >
                          <span className="material-symbols-outlined">mic</span>
                      </button>
                      <button
                          type="submit"
                          disabled={chatLoading || (!currentMessage.trim() && !attachedImage) || isChatClosed || isRecording}
                          className="p-2 bg-[#212147] text-white rounded-full hover:bg-[#1b1b3a] transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                          aria-label="Enviar mensaje"
                      >
                          <span className="material-symbols-outlined">send</span>
                      </button>
                  </div>
              </form>
              <p className="text-xs text-center text-slate-500 pt-2 px-2">
                  Asistente de IA puede cometer errores. Comprueba la información importante.
              </p>
         </div>
      )}
    </div>
  );
};

export default AIAssistant;