import { useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { Slider } from "./components/ui/slider";
/* import { cn } from "./lib/utils"; */
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Play,
  Pause,
  ArrowLeftToLine,
  Volume1,
  Volume2,
  VolumeX,
  Minimize,
  Maximize,
} from "lucide-react";
import screenfull from "screenfull";
import { cn } from "./lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const playbackRateOptions = [-16, -8, -4, -2, 1, 2, 4, 8, 16 /* , 32, 64 */];

// TODO:
// 1. Fast Forward custom en velocidades 32x,64x
// 2. Backwards custom en velocidades -2px, -4px, -8px, -16x
// 3. Resolución de bugs: de -16x a 8x o 16x a veces el reproductor queda atascado. Tampoco se reproduce correctamente en resoluciones como 640x360
// 4. Mejoras en accesibilidad y/o diseño

function VideoPlayer({
  videoRef,
  videoSrc,
}: {
  videoSrc: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const [playbackRatePopoverOpen, setPlaybackRatePopoverOpen] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value / 100;
      setVolume(value);
    }
  };

  const handleCurrentTimeChange = (value: number[]) => {
    const newValue = value[0] as number;
    if (videoRef.current) {
      videoRef.current.currentTime = newValue;
      setCurrentTime(newValue);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlaybackRateChange = (rate: string) => {
    if (videoRef.current) {
      const newRate = Number(rate);
      if (newRate < 1) {
        videoRef.current.playbackRate = 1;
        videoRef.current.playbackRate = 1 / Math.abs(newRate);
      } else {
        videoRef.current.playbackRate = newRate;
      }

      setPlaybackRate(newRate);
      setPlaybackRatePopoverOpen(false);
    }
  };

  useEffect(() => {
    if (screenfull.isEnabled) {
      screenfull.on("change", () => {
        setFullscreen(screenfull.isFullscreen);
      });
    }
  }, []);

  const toggleFullScreen = () => {
    if (videoContainerRef.current && screenfull.isEnabled) {
      screenfull.toggle(videoContainerRef.current);
    }
  };

  return (
    <section
      className={cn("group relative size-full m-auto bg-black", {
        "max-w-4xl": !fullscreen,
      })}
      ref={videoContainerRef}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <video
        className={cn("m-auto max-w-4xl", {
          "max-w-full size-full": fullscreen,
        })}
        onClick={handlePlayPause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        src={videoSrc}
        controls={false}
      >
        <source
          src="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
          type="video/mp4"
        />
      </video>
      <div className="z-20 duration-300 transition opacity-0 group-hover:opacity-100 flex flex-col w-full absolute bottom-0">
        <Slider
          value={[currentTime]}
          min={0}
          max={duration}
          step={1}
          onValueChange={handleCurrentTimeChange}
          className="w-full bg-transparent"
        />
        <div className="flex items-center gap-4 pl-4 bg-black/50">
          <Button
            className="bg-transparent w-fit hover:bg-transparent p-0"
            onClick={handlePlayPause}
          >
            {isPlaying && currentTime !== duration ? <Pause /> : <Play />}
          </Button>
          <Button
            className="bg-transparent w-fit hover:bg-transparent p-0"
            onClick={handleStop}
          >
            <ArrowLeftToLine />
          </Button>
          <div className="flex items-center gap-1 text-white w-fit group/volume">
            <Button
              className="bg-transparent w-fit hover:bg-transparent p-0"
              onClick={() => handleVolumeChange(0)}
            >
              {volume === 0 ? (
                <VolumeX />
              ) : volume < 50 ? (
                <Volume1 />
              ) : (
                <Volume2 />
              )}
            </Button>
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => handleVolumeChange(value[0] as number)}
              className="duration-500 transition-all ease-in-out group-hover/volume:translate-x-0 -translate-x-5 opacity-0 group-hover/volume:opacity-100 w-0 rounded-full group-hover/volume:w-24 flex bg-transparent"
            />
          </div>
          <span className="text-white text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div className="flex gap-4 mr-0 ml-auto pr-4 group/playback">
            <Popover
              open={playbackRatePopoverOpen}
              onOpenChange={setPlaybackRatePopoverOpen}
            >
              <PopoverTrigger className="bg-transparent w-fit hover:bg-transparent p-0 text-white">
                {playbackRate}x
              </PopoverTrigger>
              <PopoverContent
                sideOffset={16}
                className="bg-black/75 text-white p-0 w-16 m-0"
              >
                <ToggleGroup
                  type="single"
                  className="overflow-y-auto h-fit flex flex-col"
                  defaultValue="1"
                  value={`${playbackRate}`}
                  onValueChange={handlePlaybackRateChange}
                >
                  {playbackRateOptions.map((rate) => (
                    <ToggleGroupItem
                      key={rate}
                      value={`${rate}`}
                      aria-label={`${rate}x`}
                      className="aria-checked:bg-black/50 w-full first:rounded-t-md last:rounded-b-md py-1"
                    >
                      {rate}x
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </PopoverContent>
            </Popover>
            <Button
              className="bg-transparent w-fit hover:bg-transparent p-0 text-white"
              onClick={toggleFullScreen}
            >
              {fullscreen ? <Minimize /> : <Maximize />}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [videoSrc, setVideoSrc] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-gray-100 p-4">
      {!videoSrc && (
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="video">
            Cargue un archivo .mp4 para utilizar el reproductor.
          </Label>
          <Input
            id="video"
            type="file"
            accept="video/mp4"
            onChange={handleFileChange}
            className="hover:cursor-pointer"
          />
        </div>
      )}
      {videoSrc && <VideoPlayer videoSrc={videoSrc} videoRef={videoRef} />}
    </div>
  );
}
