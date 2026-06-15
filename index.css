import React, { useState } from "react";
import { Sparkles, Loader2, BookOpen, UserCheck, AlertTriangle } from "lucide-react";
import { PanelStats, TierConstants } from "../types";

interface GeminiAdvisorProps {
  panel: PanelStats;
  tier: TierConstants;
  gradRate: number;
}

export default function GeminiAdvisor({ panel, tier, gradRate }: GeminiAdvisorProps) {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [provider, setProvider] = useState<"gemini" | "deepseek">("gemini");
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("wwm_custom_ai_key") || "";
    }
    return "";
  });
  const [showConfig, setShowConfig] = useState<boolean>(false);

  const handleGetSmartAdvice = async () => {
    setLoading(true);
    setError("");
    setAdvice("");

    if (typeof window !== "undefined") {
      if (customApiKey) {
        localStorage.setItem("wwm_custom_ai_key", customApiKey);
      } else {
        localStorage.removeItem("wwm_custom_ai_key");
      }
    }

    try {
      if (provider === "gemini" && customApiKey) {
        const prompt = `
          You are an expert math and gearing theorist for the Wuxia open-world game "Where Winds Meet".
          Our player is using the "Bamboocut-Dust" (Bamboocut-Wind/Splendor) build specializing in Everspring Umbrella and Rope Dart in Season 3 (Grade 95, Level 91 gear tier).
          
          Here are the player's current attributes:
          - Physical Attack: Min ${panel.minOuter}, Max ${panel.maxOuter}
          - Physical Penetration: ${panel.outerPen}%
          - Attribute Atk (Bamboocut): Min ${panel.minPz}, Max ${panel.maxPz}
          - Attribute Pen (Bamboocut): ${panel.pzPen}%
          - Bamboocut DMG Bonus: ${panel.pzDmg}%
          - Precision Rate: ${panel.prec}%
          - Critical Rate: ${panel.crit}%, Direct Crit: ${panel.dcrit}%
          - Critical DMG: ${panel.critDmg}%
          - Affinity Rate: ${panel.aff}%, Direct Affinity: ${panel.daff}%
          - Affinity DMG: ${panel.affDmg}%
          - Armor Set: ${panel.set}
          
          Currently targeted Dungeon Tier:
          - Boss Defense: ${tier.def}
          - Boss Judgment Resistance: ${tier.judgeRes}px
          - Current Graduation Rate: ${gradRate.toFixed(1)}%

          Provide a high-quality, professional, and laser-focused upgrade roadmap and gearing strategy in English ONLY. 
          Format your response in neat, markdown-structured points with bold titles.
          Cover:
          1. **Evaluation**: Analyze if we are close to the physical pen and max physical attack baseline targets for Tier 91 graduation.
          2. **Substat Relaying Recommendation**: Explain which priority substats (e.g., Physical Pen, Max Outer Atk, Bamboocut Atk) to relay onto gear slots. Point out the Level 91 stat caps (e.g. +9% Physical Pen, +63.8 Max Physical Atk).
          3. **Arsenal Upgrades**: Advise on where points should be spent in the weapon manual to recover missing panel Precision, Atk, or Crit stats.
          4. **Armor Set & Mastery Advice**: Compare Stars Align vs Eaglerise for their current rates.
          
          Keep the tone encouraging, technical, pragmatic, and detailed. Do not cite simulated container ids or file paths.
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${customApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini direct API returned ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        setAdvice(text || "No advice returned.");
      } else {
        const response = await fetch("/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            panel,
            tier,
            gradRate: gradRate.toFixed(1),
            baselineScore: "scaled_ref",
            totalDmgScore: "rotation_calc",
            provider,
            customApiKey: customApiKey || undefined,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setAdvice(data.advice || "No advice returned.");
        } else {
          setError(data.error || "Failed to retrieve smart advice.");
        }
      }
    } catch (err: any) {
      console.error("Failed to query Optimize API:", err);
      setError("An operational error occurred while contacting the advisor service: " + (err?.message || "Verify your setup."));
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedMarkdown = (txt: string) => {
    return txt.split("\n").map((line, idx) => {
      let content = line.trim();
      
      if (!content) return <div key={idx} className="h-2" />;

      // Match ### Header
      if (content.startsWith("###")) {
        return (
          <h4 key={idx} className="text-xs font-semibold font-sans text-amber-500 tracking-wider uppercase mt-4 mb-2">
            {content.slice(3).trim()}
          </h4>
        );
      }
      
      // Match ## Header
      if (content.startsWith("##")) {
        return (
          <h3 key={idx} className="text-sm font-bold font-sans text-amber-400 border-b border-slate-800 pb-1 mt-5 mb-2.5">
            {content.slice(2).trim()}
          </h3>
        );
      }

      // Match bold weights: **Text**
      let elements: React.ReactNode[] = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          elements.push(content.substring(lastIndex, match.index));
        }
        elements.push(
          <strong key={match.index} className="text-amber-300 font-semibold">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        elements.push(content.substring(lastIndex));
      }

      // Check bullet points
      if (content.startsWith("-") || content.startsWith("*")) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-300 mb-1.5 leading-relaxed">
            {elements.length > 0 ? elements : content.slice(1).trim()}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-300 mb-2.5 leading-relaxed">
          {elements.length > 0 ? elements : content}
        </p>
      );
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse animate-duration-3000" />
          <div>
            <h3 className="text-sm font-semibold font-sans text-slate-100 uppercase tracking-wider">
              AI Gearing Strategy Advisor
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyze your current statistics and receive optimizing guidelines powered by Gemini or Deepseek.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3 py-2 text-xs border border-slate-800 hover:border-slate-700 bg-slate-950 font-medium text-slate-300 rounded-lg shrink-0 transition-colors cursor-pointer"
          >
            ⚙️ Configure API Key ({provider === "gemini" ? "Gemini" : "Deepseek"})
          </button>

          <button
            onClick={handleGetSmartAdvice}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Advising...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Smart Optimization Advice
              </>
            )}
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="mb-4 p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
          <h4 className="text-[11px] font-mono uppercase tracking-widest text-[#a19683]">
            AI Engine Setup
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Target AI Engine Model</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProvider("gemini")}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold text-center transition-all ${
                    provider === "gemini"
                      ? "bg-amber-500/15 border border-amber-500 text-amber-400"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  Google Gemini (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setProvider("deepseek")}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold text-center transition-all ${
                    provider === "deepseek"
                      ? "bg-amber-500/15 border border-amber-500 text-amber-400"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  Deepseek Chat
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Your API Key (Optional)
              </label>
              <input
                type="password"
                placeholder={provider === "gemini" ? "Enter Gemini API Key..." : "Enter Deepseek API Key..."}
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                className="w-full bg-slate-900 text-slate-100 border border-slate-805 text-xs px-3 py-1.5 rounded focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-[9px] text-slate-500 mt-1 block">
                * Leave empty to utilize backend environment credentials if configured.
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-900 text-rose-300 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="py-8 text-center bg-slate-950/30 rounded-lg border border-slate-800/40 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm text-slate-300 font-medium">Gemini is processing your stats profile...</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Evaluating your panel properties against active Season 3 metrics and preparing upgrade guidance.
          </p>
        </div>
      )}

      {advice && !loading && (
        <div className="bg-slate-950/70 rounded-lg border border-slate-800/85 p-5 shadow-inner">
          <div className="flex items-center gap-2 mb-4 text-amber-400/90 border-b border-slate-800/40 pb-2.5">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Tailored Upgrade Strategy Roadmap</span>
          </div>
          <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {renderFormattedMarkdown(advice)}
          </div>
        </div>
      )}

      {!advice && !loading && !error && (
        <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
          <BookOpen className="w-8 h-8 text-slate-600 mb-2" />
          <p>Click <strong>Smart Optimization Advice</strong> to evaluate your profile with AI.</p>
        </div>
      )}
    </div>
  );
}
