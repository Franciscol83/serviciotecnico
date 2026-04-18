/**
 * Servicio Socket.IO para chat en tiempo real
 */
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

class SocketService {
  socket = null;
  isConnected = false;

  /**
   * Conectar Socket.IO y autenticar usuario
   */
  connect(userId) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO conectado');
      this.isConnected = true;
      // Autenticar usuario
      this.socket.emit('authenticate', { usuario_id: userId });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.IO desconectado');
      this.isConnected = false;
    });

    this.socket.on('authenticated', (data) => {
      console.log('🔐 Autenticado en Socket.IO', data);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
    });

    return this.socket;
  }

  /**
   * Desconectar Socket.IO
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Enviar mensaje
   */
  sendMessage(mensaje) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', mensaje);
    }
  }

  /**
   * Escuchar mensajes nuevos
   */
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  /**
   * Limpiar listener de mensajes
   */
  offNewMessage() {
    if (this.socket) {
      this.socket.off('new_message');
    }
  }

  /**
   * Usuario está escribiendo
   */
  typing(destinatario_id) {
    if (this.socket?.connected) {
      this.socket.emit('typing', { destinatario_id });
    }
  }

  /**
   * Usuario dejó de escribir
   */
  stopTyping(destinatario_id) {
    if (this.socket?.connected) {
      this.socket.emit('stop_typing', { destinatario_id });
    }
  }

  /**
   * Escuchar cuando alguien está escribiendo
   */
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  /**
   * Escuchar cuando alguien dejó de escribir
   */
  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on('user_stop_typing', callback);
    }
  }

  /**
   * Mensaje entregado (confirmación)
   */
  onMessageDelivered(callback) {
    if (this.socket) {
      this.socket.on('message_delivered', callback);
    }
  }

  /**
   * Mensaje leído (confirmación)
   */
  onMessageRead(callback) {
    if (this.socket) {
      this.socket.on('message_read_receipt', callback);
    }
  }

  /**
   * Notificar que se leyó un mensaje
   */
  messageRead(mensaje_id, remitente_id) {
    if (this.socket?.connected) {
      this.socket.emit('message_read', { mensaje_id, remitente_id });
    }
  }
}

export default new SocketService();
