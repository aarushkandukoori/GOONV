import { useCallback, useEffect, useRef, useState } from 'react';
import { containsWakePhrase, extractQueryAfterWake } from '../lib/facetime';

type SpeechRecognitionType = typeof window.SpeechRecognition;

export type AssistantStatus =
  | 'idle'
  | 'joining'
  | 'introducing'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseGoonvAssistantOptions {
  onStatusChange?: (status: AssistantStatus) => void;
}

export function useGoonvAssistant(options: UseGoonvAssistantOptions = {}) {
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isActiveRef = useRef(false);
  const awaitingQueryRef = useRef(false);
  const queryBufferRef = useRef('');
  const queryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSpeakingRef = useRef(false);

  const updateStatus = useCallback(
    (next: AssistantStatus) => {
      setStatus(next);
      options.onStatusChange?.(next);
    },
    [options],
  );

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!window.speechSynthesis) {
          resolve();
          return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.1;

        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(
          (v) =>
            v.name.includes('Samantha') ||
            v.name.includes('Google US English') ||
            v.lang.startsWith('en'),
        );
        if (preferred) utterance.voice = preferred;

        isSpeakingRef.current = true;
        utterance.onend = () => {
          isSpeakingRef.current = false;
          resolve();
        };
        utterance.onerror = () => {
          isSpeakingRef.current = false;
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });
    },
    [],
  );

  const askGoonv = useCallback(
    async (question: string) => {
      if (!question.trim()) return;

      updateStatus('processing');
      setTranscript(question);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: question, history }),
        });

        const data = await res.json();
        const reply = data.reply || data.error || "AHHH I got nothin', try again!";

        setLastResponse(reply);
        setHistory((prev) => [
          ...prev,
          { role: 'user', content: question },
          { role: 'assistant', content: reply },
        ]);

        updateStatus('speaking');
        await speak(reply);
        updateStatus('listening');
      } catch {
        setError('Failed to reach Goonv HQ');
        updateStatus('error');
      }
    },
    [history, speak, updateStatus],
  );

  const scheduleQuerySubmit = useCallback(() => {
    if (queryTimeoutRef.current) clearTimeout(queryTimeoutRef.current);
    queryTimeoutRef.current = setTimeout(() => {
      const q = queryBufferRef.current.trim();
      queryBufferRef.current = '';
      awaitingQueryRef.current = false;
      if (q) askGoonv(q);
      else {
        speak("AHHH yeah? I'm listening — what do you need?").then(() =>
          updateStatus('listening'),
        );
      }
    }, 1800);
  }, [askGoonv, speak, updateStatus]);

  const handleRecognitionResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) finalText += text;
        else interim += text;
      }

      const display = (finalText || interim).trim();
      if (display) setTranscript(display);

      if (isSpeakingRef.current) return;

      const combined = (finalText || interim).toLowerCase();

      if (awaitingQueryRef.current) {
        if (finalText) {
          queryBufferRef.current = (
            queryBufferRef.current +
            ' ' +
            finalText
          ).trim();
          scheduleQuerySubmit();
        }
        return;
      }

      if (containsWakePhrase(combined)) {
        const fullText = finalText || interim;
        const inlineQuery = extractQueryAfterWake(fullText);

        if (inlineQuery.length > 3) {
          askGoonv(inlineQuery);
        } else {
          awaitingQueryRef.current = true;
          queryBufferRef.current = '';
          updateStatus('listening');
          speak("AHHH what's up goon squad!").then(() => updateStatus('listening'));
        }
      }
    },
    [askGoonv, scheduleQuerySubmit, speak, updateStatus],
  );

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setError('Speech recognition not supported in this browser. Try Chrome.');
      updateStatus('error');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = handleRecognitionResult;
    recognition.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      console.warn('Speech error:', e.error);
    };
    recognition.onend = () => {
      if (isActiveRef.current && !isSpeakingRef.current) {
        try {
          recognition.start();
        } catch {
          /* ignore restart race */
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      updateStatus('listening');
    } catch (err) {
      setError('Could not start microphone. Check permissions.');
      updateStatus('error');
    }
  }, [handleRecognitionResult, updateStatus]);

  const activate = useCallback(
    async (intro: string) => {
      setError(null);
      isActiveRef.current = true;
      updateStatus('introducing');

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setError('Microphone access is required for Goonv to hear "Hey Gooner".');
        updateStatus('error');
        isActiveRef.current = false;
        return;
      }

      await speak(intro);
      startListening();
    },
    [speak, startListening, updateStatus],
  );

  const deactivate = useCallback(() => {
    isActiveRef.current = false;
    awaitingQueryRef.current = false;
    queryBufferRef.current = '';
    if (queryTimeoutRef.current) clearTimeout(queryTimeoutRef.current);
    window.speechSynthesis?.cancel();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }

    updateStatus('idle');
    setTranscript('');
  }, [updateStatus]);

  useEffect(() => {
    return () => deactivate();
  }, [deactivate]);

  useEffect(() => {
    window.speechSynthesis?.getVoices();
  }, []);

  return {
    status,
    transcript,
    lastResponse,
    error,
    history,
    activate,
    deactivate,
    isActive: status !== 'idle' && status !== 'error',
  };
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionType;
    webkitSpeechRecognition: SpeechRecognitionType;
  }
}
