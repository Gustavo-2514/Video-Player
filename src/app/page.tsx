"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Link from "next/link";

interface Video {
  name: string;
  url: string;
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const router = useRouter();

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/videos");
      if (!response.ok) {
        throw new Error("Erro ao carregar vídeos");
      }
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar vídeos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled) {
          setAuthRequired(true);
          const isAuth = sessionStorage.getItem("authenticated") === "true";
          setAuthenticated(isAuth);
          if (!isAuth) {
            setLoading(false);
          } else {
            loadVideos();
          }
        } else {
          setAuthRequired(false);
          setAuthenticated(true);
          loadVideos();
        }
      })
      .catch(() => {
        setAuthRequired(false);
        setAuthenticated(true);
        loadVideos();
      });
  }, [loadVideos]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("authenticated", "true");
        setAuthenticated(true);
        setPin("");
        loadVideos();
      } else {
        setPinError(data.error || "PIN incorreto");
      }
    } catch (err) {
      setPinError("Erro ao validar PIN");
    }
  };

  const handleVideoClick = (videoName: string) => {
    router.push(`/video/${encodeURIComponent(videoName)}`);
  };

  if (!authenticated && authRequired) {
    return (
      <div style={styles.container}>
        <div style={styles.authBox}>
          <h1 style={styles.title}>Acesso Restrito</h1>
          <p style={styles.subtitle}>Digite o PIN de 4 dígitos</p>
          <form onSubmit={handlePinSubmit} style={styles.form}>
            <input
              type="text"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                setPin(value);
              }}
              placeholder="0000"
              maxLength={4}
              style={styles.pinInput}
              autoFocus
            />
            {pinError && <p style={styles.error}>{pinError}</p>}
            <button type="submit" style={styles.submitButton}>
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Vídeos Disponíveis</h1>

      {loading && <p style={styles.message}>Carregando...</p>}

      {error && <p style={styles.error}>{error}</p>}

      {!loading && !error && videos.length === 0 && (
        <p style={styles.message}>Nenhum vídeo encontrado</p>
      )}

      {!loading && !error && videos.length > 0 && (
        <ul style={styles.videoList}>
          {videos.map((video) => (
            <li key={video.name} style={styles.videoItem}>
              <Card style={{ padding: 0 }}>
                <Button
                  onClick={() => handleVideoClick(video.name)}
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    background: "transparent",
                    color: "#111",
                    padding: "0.75rem 1rem",
                    borderRadius: 0,
                  }}
                >
                  <Play size={18} />
                  <span
                    style={{
                      marginLeft: 12,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {video.name}
                  </span>
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "2rem",
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: "1rem",
    marginBottom: "1rem",
    textAlign: "center",
    color: "#666",
  },
  message: {
    textAlign: "center",
    color: "#666",
    marginTop: "2rem",
  },
  error: {
    textAlign: "center",
    color: "#d32f2f",
    marginTop: "1rem",
  },
  videoList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  videoItem: {
    marginBottom: "0.5rem",
  },
  videoButton: {
    width: "100%",
    padding: "1rem",
    fontSize: "1rem",
    textAlign: "left",
    backgroundColor: "#f5f5f5",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  authBox: {
    maxWidth: "400px",
    margin: "0 auto",
    padding: "2rem",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  pinInput: {
    padding: "0.75rem",
    fontSize: "1.5rem",
    textAlign: "center",
    letterSpacing: "0.5rem",
    border: "2px solid #ddd",
    borderRadius: "4px",
    outline: "none",
  },
  submitButton: {
    padding: "0.75rem",
    fontSize: "1rem",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
