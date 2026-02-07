"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Link from "next/link";

interface Video {
  name: string;
  poster: string;
  url?: string;
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
      <h1 style={styles.title}>Filmes Disponíveis</h1>

      {loading && <p style={styles.message}>Carregando...</p>}

      {error && <p style={styles.error}>{error}</p>}

      {!loading && !error && videos.length === 0 && (
        <p style={styles.message}>Nenhum vídeo encontrado</p>
      )}

      {!loading && !error && videos.length > 0 && (
        <div style={styles.grid}>
          {videos.map((video) => (
            <div
              key={video.name}
              onClick={() => handleVideoClick(video.name)}
              style={styles.cardWrapper}
            >
              <Card style={styles.card}>
                <div style={styles.posterContainer}>
                  <img
                    src={video.poster}
                    alt={video.name}
                    style={styles.posterImage}
                    loading="lazy"
                  />
                  <div style={styles.playOverlay}>
                    <Play size={48} color="white" />
                  </div>
                </div>
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{video.name}</h3>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
    backgroundColor: "#121212",
    minHeight: "100vh",
    color: "#e0e0e0",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "2rem",
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: "1rem",
    marginBottom: "1rem",
    textAlign: "center",
    color: "#aaa",
  },
  message: {
    textAlign: "center",
    color: "#aaa",
    marginTop: "2rem",
    fontSize: "1.2rem",
  },
  error: {
    textAlign: "center",
    color: "#ff5252",
    marginTop: "1rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "2rem",
    padding: "1rem 0",
  },
  cardWrapper: {
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  card: {
    padding: 0,
    background: "#1e1e1e",
    border: "none",
    overflow: "hidden",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  posterContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: "2/3",
    backgroundColor: "#000",
  },
  posterImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 0.2s ease",
  },
  cardContent: {
    padding: "1rem",
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: "1.1rem",
    margin: 0,
    color: "#fff",
    textAlign: "center",
    fontWeight: 500,
    lineHeight: 1.4,
  },
  authBox: {
    maxWidth: "400px",
    margin: "0 auto",
    padding: "2rem",
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    border: "1px solid #333",
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
    backgroundColor: "#2c2c2c",
    border: "2px solid #333",
    color: "#fff",
    borderRadius: "8px",
    outline: "none",
  },
  submitButton: {
    padding: "0.75rem",
    fontSize: "1rem",
    backgroundColor: "#2196f3",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
};
