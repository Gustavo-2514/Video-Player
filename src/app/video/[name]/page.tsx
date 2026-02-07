"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Play,
  Pause,
  Rewind,
  FastForward,
  Volume,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
} from "lucide-react";
import Button from "../../../components/ui/Button";

export default function VideoPlayer() {
  const router = useRouter();
  const params = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const videoName = params.name as string;
  const videoUrl = `/api/stream?file=${encodeURIComponent(videoName)}`;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const savedVolume = localStorage.getItem("videoVolume");
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      video.volume = vol;
      setVolume(vol);
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleVolumeChange = () => {
      setVolume(video.volume);
      localStorage.setItem("videoVolume", String(video.volume));
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);


    video.play().catch(() => {
      setLoading(false);
    });

    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isFullscreen) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    const handleMouseLeave = () => {
      if (isFullscreen) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 2000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "00:00";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(
      0,
      Math.min(duration, video.currentTime + seconds)
    );
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    localStorage.setItem("videoVolume", String(newVolume));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted) {
      video.volume = volume || 0.5;
    }
  };

  const handleProgressClick = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    const video = videoRef.current;
    if (!video || duration === 0) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    video.currentTime = percentage * duration;
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    handleProgressClick(e);
  };

  const handleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Erro ao alternar tela cheia:", error);
    }
  };

  const handleBack = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    router.push("/");
  };

  const getStyles = () => ({
    container: {
      maxWidth: "100%",
      margin: "0 auto",
      padding: isMobile ? "0.5rem" : "1rem",
      fontFamily: "system-ui, -apple-system, sans-serif",
      backgroundColor: "#",
      minHeight: "100vh",
    } as React.CSSProperties,
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem",
      padding: isMobile ? "0.5rem" : "1rem",
      backgroundColor: "#1a1a1a",
      borderRadius: "4px",
    } as React.CSSProperties,
    title: {
      fontSize: isMobile ? "1rem" : "1.5rem",
      color: "#fff",
      margin: 0,
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    } as React.CSSProperties,
    backButton: {
      padding: isMobile ? "0.4rem 0.8rem" : "0.5rem 1rem",
      fontSize: isMobile ? "0.875rem" : "1rem",
      backgroundColor: "#333",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      marginLeft: "1rem",
      transition: "background-color 0.2s",
    } as React.CSSProperties,
    videoWrapper: {
      position: "relative",
      width: "100%",
      backgroundColor: "#000",
      borderRadius: "4px",
      overflow: "hidden",
      marginBottom: "1rem",
      cursor: "pointer",
    } as React.CSSProperties,
    videoWrapperFullscreen: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      zIndex: 9999,
      margin: 0,
      borderRadius: 0,
    } as React.CSSProperties,
    video: {
      width: "100%",
      height: "auto",
      display: "block",
      maxHeight: "80vh",
    } as React.CSSProperties,
    loading: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      color: "#fff",
      zIndex: 1,
    } as React.CSSProperties,
    controlsOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
      padding: isMobile ? "0.5rem" : "1rem",
      transition: "opacity 0.3s",
      zIndex: 10,
    } as React.CSSProperties,
    progressContainer: {
      marginBottom: isMobile ? "0.5rem" : "1rem",
    } as React.CSSProperties,
    progressBar: {
      width: "100%",
      height: isMobile ? "6px" : "8px",
      backgroundColor: "rgba(255,255,255,0.3)",
      borderRadius: "4px",
      cursor: "pointer",
      position: "relative",
      marginBottom: "0.5rem",
      touchAction: "none",
    } as React.CSSProperties,
    progressFill: {
      height: "100%",
      backgroundColor: "#1976d2",
      borderRadius: "4px",
      transition: "width 0.1s",
    } as React.CSSProperties,
    timeDisplay: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: isMobile ? "0.75rem" : "0.875rem",
      color: "#fff",
      marginTop: "0.25rem",
    } as React.CSSProperties,
    controls: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: isMobile ? "0.5rem" : "1rem",
      flexWrap: "wrap",
    } as React.CSSProperties,
    controlsLeft: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? "0.25rem" : "0.5rem",
      flex: 1,
      flexWrap: "wrap",
    } as React.CSSProperties,
    controlsRight: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    } as React.CSSProperties,
    iconButton: {
      padding: isMobile ? "0.5rem" : "0.75rem",
      fontSize: isMobile ? "1.2rem" : "1.5rem",
      backgroundColor: "transparent",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: isMobile ? "36px" : "44px",
      minHeight: isMobile ? "36px" : "44px",
      transition: "background-color 0.2s",
    } as React.CSSProperties,
    volumeContainer: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      minWidth: isMobile ? "80px" : "120px",
    } as React.CSSProperties,
    volumeSlider: {
      flex: 1,
      height: "4px",
      appearance: "none" as const,
      WebkitAppearance: "none" as const,
      backgroundColor: "rgba(255,255,255,0.3)",
      borderRadius: "2px",
      outline: "none",
      cursor: "pointer",
    } as React.CSSProperties,
    timeInfo: {
      fontSize: isMobile ? "0.75rem" : "0.875rem",
      color: "#fff",
      marginLeft: "auto",
      whiteSpace: "nowrap",
    } as React.CSSProperties,
  });

  const styles = getStyles();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .volume-slider::-webkit-slider-thumb {
        appearance: none;
        -webkit-appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #1976d2;
        cursor: pointer;
      }
      .volume-slider::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #1976d2;
        cursor: pointer;
        border: none;
      }
      .volume-slider:hover::-webkit-slider-thumb {
        background: #1565c0;
      }
      .volume-slider:hover::-moz-range-thumb {
        background: #1565c0;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={styles.container} >
      <div style={styles.header}>
        <h2 style={styles.title}>{videoName}</h2>
        <Button onClick={handleBack} style={styles.backButton}>
          <ArrowLeft size={16} />
          <span style={{ marginLeft: 6 }}>Voltar</span>
        </Button>
      </div>

      <div
        ref={containerRef}
        style={{
          ...styles.videoWrapper,
          ...(isFullscreen ? styles.videoWrapperFullscreen : {}),
        }}
        onDoubleClick={handleFullscreen}
      >
        {loading && (
          <div style={styles.loading}>
            <p>Carregando vídeo...</p>
          </div>
        )}
        <video
          ref={videoRef}
          src={videoUrl}
          controls={false}
          preload="metadata"
          style={styles.video}
          onClick={handlePlayPause}
          className=""
        />

        <div
          style={{
            ...styles.controlsOverlay,
            opacity: showControls || !isFullscreen ? 1 : 0,
            pointerEvents: showControls || !isFullscreen ? "auto" : "none",
          }}
        >
          <div style={styles.progressContainer}>
            <div
              style={styles.progressBar}
              onClick={handleProgressClick}
              onMouseMove={handleProgressDrag}
              onTouchStart={handleProgressClick}
              onTouchMove={handleProgressClick}
            >
              <div
                style={{
                  ...styles.progressFill,
                  width:
                    duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />
            </div>
            <div style={styles.timeDisplay}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div style={styles.controls}>
            <div style={styles.controlsLeft}>
              <button
                onClick={() => handleSeek(-10)}
                style={styles.iconButton}
                aria-label="Retroceder 10 segundos"
              >
                <Rewind color="#fff" size={18} />
              </button>
              <button
                onClick={handlePlayPause}
                style={styles.iconButton}
                aria-label={isPlaying ? "Pausar" : "Reproduzir"}
              >
                {isPlaying ? (
                  <Pause color="#fff" size={18} />
                ) : (
                  <Play color="#fff" size={18} />
                )}
              </button>
              <button
                onClick={() => handleSeek(10)}
                style={styles.iconButton}
                aria-label="Avançar 10 segundos"
              >
                <FastForward color="#fff" size={18} />
              </button>

              <div style={styles.volumeContainer}>
                <button
                  onClick={toggleMute}
                  style={styles.iconButton}
                  aria-label={
                    videoRef.current?.muted ? "Ativar som" : "Desativar som"
                  }
                >
                  {videoRef.current?.muted || volume === 0 ? (
                    <VolumeX color="#fff" size={18} />
                  ) : (
                    <Volume color="#fff" size={18} />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={videoRef.current?.muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={styles.volumeSlider}
                  className="volume-slider"
                  aria-label="Volume"
                />
              </div>

              <div style={styles.timeInfo}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div style={styles.controlsRight}>
              <button
                onClick={handleFullscreen}
                style={styles.iconButton}
                aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
              >
                {isFullscreen ? (
                  <Minimize2 color="#fff" size={18} />
                ) : (
                  <Maximize2 color="#fff" size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
