import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { SUBJECTS } from '../constants';
import { ChatHeader, MessageList, InputArea } from '../components/ChatParts';
import { AppMode } from '../types';

export const Chat = () => {
  const { subjectId } = useParams();
  const { setActiveSubject, setActiveMode, createNewSession, sessions, setActiveSessionId, userSettings } = useAppContext();

  useEffect(() => {
    const sub = SUBJECTS.find(s => s.id === subjectId);
    if (sub) {
      setActiveSubject(sub);
      setActiveMode(sub.modes[0] || AppMode.CHAT);
      
      const subSessions = sessions.filter(s => s.subjectId === sub.id).sort((a, b) => b.lastModified - a.lastModified);
      if (subSessions.length > 0) {
        setActiveSessionId(subSessions[0].id);
      } else {
        createNewSession(sub.id);
      }
    }
  }, [subjectId, sessions.length]); // Re-run if sessions length changes (init load)

  return (
    <div className={`flex-1 flex flex-col relative h-full ${userSettings.customBackground ? 'bg-transparent' : 'bg-[#f9fafb] dark:bg-[#09090b]'}`}>
      <ChatHeader />
      <MessageList />
      <InputArea />
    </div>
  );
};