import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ShieldAlert, User, CheckCircle2, Circle, Search, ArrowLeft } from 'lucide-react';
import { ViewFrame } from '../types';
import { MOCK_STAFF } from '../data';

interface MessagesViewProps {
  userRole: 'public' | 'applicant' | 'staff' | 'admin';
  onNavigate: (view: ViewFrame) => void;
}

interface LocalMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  role: 'applicant' | 'staff';
  recipientId: string; // To filter messages appropriately
}

export default function MessagesView({ userRole, onNavigate }: MessagesViewProps) {
  const [messages, setMessages] = useState<LocalMessage[]>(() => {
    const saved = localStorage.getItem('etayo_role_messages');
    if (saved) return JSON.parse(saved);

    // Initial default messages to seed the conversation beautifully
    return [
      {
        id: 'init-msg-1',
        sender: 'OBO Evaluator Desk',
        text: 'Hello Juan! We have completed the zoning checks for your project BP-2025-0005. Please make sure the structural seal on the architectural set is clearly legible so we can proceed.',
        timestamp: '09:12 AM',
        role: 'staff',
        recipientId: 'juan-dela-cruz'
      },
      {
        id: 'init-msg-2',
        sender: 'Juan Dela Cruz',
        text: 'Thank you for the update! I will contact my structural engineer right away to re-upload the signed blueprints. How long does the final clearance endorsement usually take?',
        timestamp: '10:05 AM',
        role: 'applicant',
        recipientId: 'obo-staff'
      },
      {
        id: 'init-msg-3',
        sender: 'OBO Evaluator Desk',
        text: 'Once we verify the structural signature, it usually takes 2-3 working days to issue the formal clearance. Let us know if you need anything else!',
        timestamp: '11:15 AM',
        role: 'staff',
        recipientId: 'juan-dela-cruz'
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [activeContactId, setActiveContactId] = useState('obo-staff');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('etayo_role_messages', JSON.stringify(messages));
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeContactId]);

  // Define contacts strictly based on user role
  const getContacts = () => {
    if (userRole === 'applicant') {
      // APPLICANT CAN ONLY MESSAGE STAFF. They CANNOT see other applicants!
      return [
        {
          id: 'obo-staff',
          name: 'Sto. Tomas OBO Evaluation Desk',
          role: 'Official Municipal Staff',
          avatar: 'OBO',
          online: true,
          badge: 0
        }
      ];
    } else {
      // Staff or Admin can message the applicant (Juan) or other staff members
      return [
        {
          id: 'juan-dela-cruz',
          name: 'Juan Dela Cruz',
          role: 'Permit Applicant (BP-2025-0005)',
          avatar: 'JD',
          online: true,
          badge: 1
        },
        {
          id: 'staff-ricardo',
          name: 'Engr. Ricardo Mercado',
          role: 'Structural Reviewer',
          avatar: 'RM',
          online: true,
          badge: 0
        },
        {
          id: 'staff-amara',
          name: 'Zoning Officer Amara Santos',
          role: 'Zoning Clearance Specialist',
          avatar: 'AS',
          online: false,
          badge: 0
        }
      ];
    }
  };

  const contacts = getContacts();

  // Set initial active contact
  useEffect(() => {
    if (userRole === 'applicant') {
      setActiveContactId('obo-staff');
    } else {
      setActiveContactId('juan-dela-cruz');
    }
  }, [userRole]);

  const activeContact = contacts.find(c => c.id === activeContactId) || contacts[0];

  // Send a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const senderName = userRole === 'applicant' ? 'Juan Dela Cruz' : 'OBO Staff Evaluator';
    const senderRole = userRole === 'applicant' ? 'applicant' : 'staff';

    const newMessage: LocalMessage = {
      id: `local-msg-${Date.now()}`,
      sender: senderName,
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      role: senderRole,
      recipientId: activeContactId
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate quick automated response in demo environment
    if (userRole === 'applicant') {
      setTimeout(() => {
        const autoReply: LocalMessage = {
          id: `reply-${Date.now()}`,
          sender: 'OBO Evaluator Desk',
          text: 'Thank you for your message. An OBO evaluation officer has received your query and is reviewing your active clearance dossier. We will post any feedback directly to your permit tracking steps timeline.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          role: 'staff',
          recipientId: 'juan-dela-cruz'
        };
        setMessages(prev => [...prev, autoReply]);
      }, 2000);
    }
  };

  // Filter messages for current active conversation
  const filteredMessages = messages.filter(msg => {
    if (userRole === 'applicant') {
      // Applicants see conversations with staff
      return (msg.role === 'applicant' && msg.recipientId === 'obo-staff') ||
             (msg.role === 'staff' && msg.recipientId === 'juan-dela-cruz');
    } else {
      // Staff see messages based on chosen contact
      if (activeContactId === 'juan-dela-cruz') {
        return (msg.role === 'applicant' && msg.recipientId === 'obo-staff') ||
               (msg.role === 'staff' && msg.recipientId === 'juan-dela-cruz');
      } else {
        // Staff-to-staff messages
        return (msg.sender === 'OBO Staff Evaluator' && msg.recipientId === activeContactId) ||
               (msg.sender === activeContact.name && msg.recipientId === 'obo-staff-internal');
      }
    }
  });

  return (
    <div id="messages-view-container" className="flex-grow bg-[#F5F8FC] min-h-screen font-sans flex flex-col">
      
      {/* Top Header Bar */}
      <header className="bg-white px-8 py-4 border-b border-blue-100 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3 text-left">
          <button 
            id="back-from-messages-btn"
            onClick={() => onNavigate(userRole === 'applicant' ? 'applicant_dashboard' : 'staff_dashboard')}
            className="flex items-center gap-1.5 text-xs text-[#0038A8] hover:text-[#002D86] font-bold px-3 py-2 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portal
          </button>
          <div>
            <h1 className="font-display font-extrabold text-md text-gray-900 leading-none">
              eTAYO Communications
            </h1>
            <span className="text-[9px] text-gray-500 font-mono mt-1 block">
              Official Messaging Office • Sto. Tomas, Pampanga
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[#CE1126]" />
          <span className="text-[10px] bg-red-50 text-[#CE1126] font-mono font-bold px-2.5 py-1 rounded border border-red-100">
            {userRole === 'applicant' ? 'Restricted Applicant Chat' : 'OBO Staff Internal Chat'}
          </span>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch h-[calc(100vh-130px)]">
        
        {/* Contact list side (Col 4) */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-blue-100 flex flex-col overflow-hidden shadow-xs">
          <div className="p-4 border-b border-blue-50 bg-blue-50/30 text-left">
            <h3 className="font-display font-bold text-xs text-[#0038A8] uppercase tracking-wider">
              {userRole === 'applicant' ? 'Official Channels' : 'Inbox Conversations'}
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">
              {userRole === 'applicant' 
                ? 'Select official municipal OBO office to consult clearances.' 
                : 'Communicate with applicants or internal specialists.'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-left">
            {contacts.map((contact) => {
              const isActive = contact.id === activeContactId;
              return (
                <button
                  key={contact.id}
                  id={`contact-item-${contact.id}`}
                  onClick={() => setActiveContactId(contact.id)}
                  disabled={userRole === 'applicant'} // Only 1 contact, no switching needed
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    isActive 
                      ? 'bg-blue-50 text-blue-900 border-[#0038A8] shadow-2xs' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-100/80 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#0038A8]/10 border border-[#0038A8]/20 flex items-center justify-center text-[#0038A8] font-bold text-xs">
                      {contact.avatar}
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs leading-snug">{contact.name}</div>
                      <div className="text-[9px] text-gray-500 font-medium font-mono">{contact.role}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {contact.online ? (
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-xs" title="Online" />
                    ) : (
                      <span className="w-2.5 h-2.5 bg-gray-300 rounded-full border-2 border-white shadow-xs" title="Offline" />
                    )}
                    {contact.badge > 0 && !isActive && (
                      <span className="bg-[#CE1126] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        {contact.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Secure disclaimer */}
          <div className="p-3.5 bg-red-50/20 border-t border-red-150 text-[10px] text-red-900 font-medium leading-relaxed flex items-start gap-2 text-left">
            <ShieldAlert className="h-4 w-4 text-[#CE1126] shrink-0 mt-0.5" />
            <div>
              <strong>Secure Privacy Protocol:</strong> Applicants are restricted from viewing or contacting other applicants under the Data Privacy Act of 2012 (R.A. 10173).
            </div>
          </div>
        </div>

        {/* Conversation Box (Col 8) */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-blue-100 flex flex-col overflow-hidden shadow-xs">
          
          {/* Active head */}
          <div className="p-4 border-b border-blue-50 flex items-center justify-between shrink-0 bg-blue-50/10 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0038A8] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                {activeContact ? activeContact.avatar : 'OBO'}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-display font-extrabold text-sm text-gray-900 leading-tight">
                  {activeContact ? activeContact.name : 'Municipal Staff Desk'}
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active evaluation support line
                </div>
              </div>
            </div>
          </div>

          {/* Chat text area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50 flex flex-col">
            {filteredMessages.length === 0 ? (
              <div className="m-auto text-center max-w-xs space-y-2">
                <MessageSquare className="h-10 w-10 text-blue-300 mx-auto stroke-[1.5]" />
                <h4 className="font-bold text-sm text-gray-800">Start the Discussion</h4>
                <p className="text-xs text-gray-400">Ask clarifying clearance details, zoning updates, or architectural feedback directly.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = (userRole === 'applicant' && msg.role === 'applicant') ||
                             (userRole !== 'applicant' && msg.role === 'staff');
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <span className="text-[9px] text-gray-500 font-bold px-1.5 mb-1">
                      {isMe ? 'You' : msg.sender}
                    </span>
                    <div 
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed text-left break-words shadow-2xs ${
                        isMe 
                          ? 'bg-[#0038A8] text-white rounded-tr-none font-medium' 
                          : 'bg-white text-gray-850 rounded-tl-none border border-blue-100/60'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-gray-400 font-mono mt-1 px-1.5">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form write */}
          <form 
            onSubmit={handleSendMessage}
            className="p-4 bg-white border-t border-blue-50 flex gap-3 items-center shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Send message to ${activeContact ? activeContact.name.split(' ')[0] : 'staff'}...`}
              className="flex-1 bg-gray-50 hover:bg-gray-100/40 text-xs py-3 px-4 rounded-xl border border-blue-150 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-850 transition-colors"
            />
            <button
              type="submit"
              id="submit-message-btn"
              className="bg-[#0038A8] hover:bg-[#002D86] text-white p-3 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer scale-100 hover:scale-105 active:scale-95 duration-150"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>

      </main>

    </div>
  );
}
