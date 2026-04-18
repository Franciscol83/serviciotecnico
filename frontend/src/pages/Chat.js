import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { chatAPI } from '@/api/client';
import socketService from '@/services/socket';
import {
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  User
} from 'lucide-react';

const Chat = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Conectar Socket.IO al montar el componente
  useEffect(() => {
    if (currentUser?.id) {
      socketService.connect(currentUser.id);

      // Escuchar mensajes nuevos
      socketService.onNewMessage(handleNewMessage);

      // Escuchar cuando alguien está escribiendo
      socketService.onUserTyping((data) => {
        if (data.remitente_id === selectedUser?.id) {
          setIsTyping(true);
        }
      });

      socketService.onUserStopTyping((data) => {
        if (data.remitente_id === selectedUser?.id) {
          setIsTyping(false);
        }
      });

      // Escuchar confirmaciones de lectura
      socketService.onMessageRead((data) => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.mensaje_id ? { ...msg, leido: true } : msg
          )
        );
      });

      return () => {
        socketService.offNewMessage();
        socketService.disconnect();
      };
    }
  }, [currentUser?.id]);

  // Cargar usuarios disponibles para chat
  useEffect(() => {
    loadUsuarios();
  }, []);

  // Cargar mensajes cuando se selecciona un usuario
  useEffect(() => {
    if (selectedUser) {
      loadMensajes(selectedUser.id);
    }
  }, [selectedUser]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getUsuarios();
      setUsers(response.data.usuarios || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMensajes = async (usuarioId) => {
    try {
      const response = await chatAPI.getMensajes(usuarioId, 50);
      setMessages(response.data.mensajes || []);
      
      // Marcar mensajes como leídos
      const mensajesNoLeidos = response.data.mensajes?.filter(
        msg => msg.destinatario_id === currentUser.id && !msg.leido
      );
      
      for (const msg of mensajesNoLeidos) {
        await chatAPI.marcarComoLeido(msg.id);
        socketService.messageRead(msg.id, msg.remitente_id);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const handleNewMessage = (mensaje) => {
    // Si el mensaje es del usuario seleccionado, agregarlo
    if (mensaje.remitente_id === selectedUser?.id || mensaje.destinatario_id === selectedUser?.id) {
      setMessages(prev => [...prev, mensaje]);
      
      // Si es un mensaje recibido, marcarlo como leído
      if (mensaje.destinatario_id === currentUser.id) {
        chatAPI.marcarComoLeido(mensaje.id);
        socketService.messageRead(mensaje.id, mensaje.remitente_id);
      }
    }
    
    // Actualizar la lista de usuarios
    loadUsuarios();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      // Crear mensaje vía API
      const response = await chatAPI.crearMensaje({
        destinatario_id: selectedUser.id,
        texto: newMessage,
        tipo: 'texto'
      });

      const mensaje = response.data;

      // Enviar por Socket.IO para tiempo real
      socketService.sendMessage({
        destinatario_id: selectedUser.id,
        mensaje: mensaje
      });

      // Agregar mensaje localmente
      setMessages([...messages, mensaje]);
      setNewMessage('');
      scrollToBottom();
      
      // Detener indicador de escritura
      socketService.stopTyping(selectedUser.id);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('Error enviando mensaje. Intenta de nuevo.');
    }
  };

  const handleTyping = () => {
    if (selectedUser && currentUser) {
      socketService.typing(selectedUser.id);
      
      // Limpiar timeout anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Detener typing después de 2 segundos sin escribir
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(selectedUser.id);
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredUsers = users.filter(u =>
    u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Lista de Usuarios - Sidebar */}
        <div className={`
          w-full lg:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col
          ${selectedUser ? 'hidden lg:flex' : 'flex'}
        `}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Chat</h2>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar contacto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Lista de Contactos */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <User className="w-16 h-16 mb-2" />
                <p>{loading ? 'Cargando...' : 'No hay contactos'}</p>
              </div>
            ) : (
              filteredUsers.map((usuario) => (
                <button
                  key={usuario.id}
                  onClick={() => setSelectedUser(usuario)}
                  className={`
                    w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700
                    ${selectedUser?.id === usuario.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {usuario.nombre_completo.charAt(0).toUpperCase()}
                    </div>
                    {usuario.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {usuario.nombre_completo}
                      </p>
                      <span className="text-xs text-gray-500 capitalize">
                        {usuario.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {usuario.email}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Área de Chat */}
        {selectedUser ? (
          <div className="flex-1 flex flex-col">
            {/* Header del Chat */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden mr-2"
                  onClick={() => setSelectedUser(null)}
                >
                  ←
                </button>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {selectedUser.nombre_completo.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedUser.nombre_completo}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {selectedUser.online ? 'En línea' : 'Desconectado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p>No hay mensajes aún</p>
                  <p className="text-sm mt-2">Envía un mensaje para comenzar</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const esMio = msg.remitente_id === currentUser.id;
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`
                            max-w-[70%] rounded-lg px-4 py-2
                            ${esMio 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                            }
                          `}
                        >
                          <p className="text-sm">{msg.texto}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className={`text-xs ${esMio ? 'text-blue-100' : 'text-gray-500'}`}>
                              {new Date(msg.fecha).toLocaleTimeString('es', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {esMio && (
                              msg.leido ? (
                                <CheckCheck className="w-4 h-4 text-blue-100" />
                              ) : (
                                <Check className="w-4 h-4 text-blue-100" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2">
                        <p className="text-sm text-gray-500">Escribiendo...</p>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensaje */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />

                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center text-gray-500">
              <User className="w-20 h-20 mx-auto mb-4" />
              <p className="text-lg font-semibold">Selecciona un contacto</p>
              <p className="text-sm mt-2">Elige una conversación de la lista</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Chat;
