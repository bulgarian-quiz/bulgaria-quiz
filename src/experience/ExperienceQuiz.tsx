import { useState } from "react";
import QuizPopup from "@/components/QuizPopup";
import { regionsData } from "@/data/questions";
import { useAuth } from "@/contexts/AuthContext";
import { usePoints } from "@/contexts/PointsContext";
import { useExperience } from "./store";

/** The province's questions. Opens by itself when the car stops at the sign, moves on after each confirmed answer and closes by itself after the last one. */
export default function ExperienceQuiz() {
  const regionId = useExperience((s) => s.currentRegionId);
  const finishRegion = useExperience((s) => s.finishRegion);
  const { user, markRegionCompleted } = useAuth();
  const { awardCorrectAnswer } = usePoints();
  const [closing, setClosing] = useState(false);
  const region = regionsData[regionId];
  if (!region) return null;

  // Fade out, then drive on; saving points happens in the background so the road never waits on the network.
  const close = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(finishRegion, 280);
  };
  const complete = (score: number) => {
    if (score > 0) void awardCorrectAnswer(score);
    if (user) void markRegionCompleted(regionId);
    close();
  };

  return <QuizPopup key={regionId} region={region} onClose={close} onComplete={complete} isClosing={closing} autoAdvance />;
}
