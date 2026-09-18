import {
  usePrefersReducedMotion
} from "./chunk-FENTOHP4.js";
import {
  clampStop,
  resolveNodePose,
  slidePalettes,
  validateSlideStory
} from "./chunk-AZPFC2BR.js";

// src/slides/SlidePlayer.tsx
import {
  useEffect,
  useId,
  useRef,
  useState
} from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function Diagram({ story, stop }) {
  const visible = story.nodes.filter(
    (n) => n.kind !== "boundary" && resolveNodePose(n, stop).opacity > 0.25
  );
  return /* @__PURE__ */ jsxs("div", { className: "uipack-slide-diagram", "data-testid": "slide-diagram", children: [
    /* @__PURE__ */ jsx("p", { className: "uipack-slide-diagram__heading", children: "Diagram view" }),
    /* @__PURE__ */ jsx("div", { className: "uipack-slide-diagram__nodes", children: visible.map((n) => /* @__PURE__ */ jsxs("div", { "data-tone": n.tone, children: [
      /* @__PURE__ */ jsx("strong", { children: n.label }),
      /* @__PURE__ */ jsx("span", { children: n.detail })
    ] }, n.id)) }),
    /* @__PURE__ */ jsx("ul", { "aria-label": "Highlighted connections", children: story.connections.filter((c) => stop.activeConnections?.includes(c.id)).map((c) => /* @__PURE__ */ jsxs("li", { children: [
      story.nodes.find((n) => n.id === c.from)?.label,
      " ",
      /* @__PURE__ */ jsx("span", { "aria-label": "to", children: "\u2192" }),
      " ",
      story.nodes.find((n) => n.id === c.to)?.label
    ] }, c.id)) })
  ] });
}
function SceneViewport({
  story,
  stopId,
  theme = "dark",
  motion = "auto",
  paused = false,
  renderMode = "auto",
  className = "",
  onSettled
}) {
  const host = useRef(null), labels = useRef(null), runtime = useRef();
  const prefersReduced = usePrefersReducedMotion();
  const reduced = motion === "none" || prefersReduced;
  const stop = story.stops.find((s) => s.id === stopId) ?? story.stops[0];
  const latest = useRef({ stop, reduced, paused, onSettled });
  latest.current = { stop, reduced, paused, onSettled };
  const [status, setStatus] = useState(
    "loading"
  );
  const [failed, setFailed] = useState(false);
  const [settled, setSettled] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (renderMode === "diagram" || failed) {
      setStatus("fallback");
      setTransitioning(false);
      setSettled(latest.current.stop.id);
      return;
    }
    setStatus("loading");
    void import("./renderer-4H6F3QNC.js").then(({ createSlideScene }) => {
      if (cancelled || !host.current || !labels.current) return;
      try {
        runtime.current = createSlideScene(
          host.current,
          labels.current,
          story,
          latest.current.stop,
          theme,
          latest.current.reduced,
          () => setFailed(true),
          (id) => {
            if (!cancelled) {
              setSettled(id);
              setTransitioning(false);
              latest.current.onSettled?.(id);
            }
          }
        );
        runtime.current.setPaused(latest.current.paused);
        setStatus("ready");
      } catch {
        if (!cancelled) setFailed(true);
      }
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
      runtime.current?.dispose();
      runtime.current = void 0;
    };
  }, [story, theme, renderMode, failed]);
  useEffect(() => {
    if (renderMode === "diagram" || failed) {
      setSettled(stop.id);
      setTransitioning(false);
      onSettled?.(stop.id);
      return;
    }
    if (runtime.current) {
      setTransitioning(!reduced);
      runtime.current.goTo(stop, reduced);
    }
  }, [stop, renderMode, failed]);
  useEffect(() => {
    runtime.current?.setReducedMotion(reduced);
  }, [reduced]);
  useEffect(() => {
    runtime.current?.setPaused(paused);
  }, [paused]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `uipack-slide-scene ${className}`,
      "data-theme": theme,
      "data-renderer": status,
      "data-stop": stop.id,
      "data-settled-stop": settled,
      "data-transitioning": transitioning,
      "data-motion": reduced ? "reduced" : "full",
      "aria-label": `${story.title}: ${stop.title}`,
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "uipack-slide-scene__webgl",
            ref: host,
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsx("div", { ref: labels, className: "uipack-slide-labels", "aria-hidden": "true", children: story.nodes.map((n) => /* @__PURE__ */ jsxs(
          "div",
          {
            "data-node": n.id,
            "data-tone": n.tone,
            className: "uipack-slide-label",
            style: { visibility: "hidden" },
            children: [
              /* @__PURE__ */ jsx("strong", { children: n.label }),
              /* @__PURE__ */ jsx("span", { children: n.detail })
            ]
          },
          n.id
        )) }),
        status !== "ready" && /* @__PURE__ */ jsx(Diagram, { story, stop }),
        status === "ready" && /* @__PURE__ */ jsxs("span", { className: "uipack-slide-scene__badge", children: [
          "Live 3D ",
          /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\xB7" }),
          " ",
          reduced ? "Reduced motion" : "Authored camera"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "uipack-slide-sr", children: story.nodes.filter(
          (n) => n.kind !== "boundary" && resolveNodePose(n, stop).opacity > 0.25
        ).map((n) => /* @__PURE__ */ jsxs("p", { children: [
          n.label,
          ": ",
          n.detail
        ] }, n.id)) })
      ]
    }
  );
}
function SlideScene(props) {
  const errors = validateSlideStory(props.story);
  if (errors.length)
    return /* @__PURE__ */ jsxs("div", { role: "alert", className: "uipack-slide-error", children: [
      "Invalid slide story: ",
      errors.join(" ")
    ] });
  return /* @__PURE__ */ jsx(SceneViewport, { ...props }, props.story.id);
}
function Player({
  story,
  stopId,
  defaultStopId,
  onStopChange,
  theme = "dark",
  motion = "auto",
  paused: externalPaused,
  renderMode,
  footer,
  className = "",
  style,
  onSettled
}) {
  const initial = Math.max(
    0,
    story.stops.findIndex((s) => s.id === defaultStopId)
  );
  const [internal, setInternal] = useState(initial), [paused, setPaused] = useState(false), [present, setPresent] = useState(false), [diagram, setDiagram] = useState(false);
  const reduced = usePrefersReducedMotion() || motion === "none";
  const root = useRef(null);
  const titleId = useId();
  const index = stopId === void 0 ? clampStop(internal, story.stops.length) : Math.max(
    0,
    story.stops.findIndex((s) => s.id === stopId)
  );
  const stop = story.stops[index];
  const navigate = (value) => {
    const next = clampStop(value, story.stops.length);
    if (stopId === void 0) setInternal(next);
    if (next !== index) onStopChange?.(story.stops[next].id);
  };
  function keyboard(event) {
    const target = event.target;
    if (target.matches("input, textarea, select") || target.isContentEditable || event.altKey || event.ctrlKey || event.metaKey)
      return;
    const to = event.key === "ArrowRight" || event.key === "PageDown" ? index + 1 : event.key === "ArrowLeft" || event.key === "PageUp" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? story.stops.length - 1 : void 0;
    if (to !== void 0) {
      event.preventDefault();
      navigate(to);
    }
    if (event.key === "Escape") setPresent(false);
  }
  useEffect(() => {
    if (!present) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [present]);
  return /* @__PURE__ */ jsxs(
    "section",
    {
      ref: root,
      tabIndex: 0,
      onKeyDown: keyboard,
      "aria-label": `${story.title} presentation`,
      className: `uipack-slide-player ${present ? "uipack-slide-player--present" : ""} ${className}`,
      style,
      "data-theme": theme,
      "data-story": story.id,
      "data-stop": stop.id,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "uipack-slide-player__top", children: [
          /* @__PURE__ */ jsx("span", { children: story.title }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setDiagram((v) => !v),
                "aria-pressed": diagram,
                children: diagram ? "3D view" : "Diagram view"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                disabled: reduced || externalPaused !== void 0,
                onClick: () => setPaused((v) => !v),
                "aria-pressed": paused,
                children: paused ? "Resume flow" : "Pause flow"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setPresent((v) => !v),
                "aria-pressed": present,
                children: present ? "Exit presentation" : "Present"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "uipack-slide-player__body", children: [
          /* @__PURE__ */ jsxs(
            "header",
            {
              className: "uipack-slide-player__copy",
              "aria-live": "polite",
              "aria-atomic": "true",
              children: [
                /* @__PURE__ */ jsxs("span", { className: "uipack-slide-player__count", children: [
                  String(index + 1).padStart(2, "0"),
                  " /",
                  " ",
                  String(story.stops.length).padStart(2, "0")
                ] }),
                /* @__PURE__ */ jsx("h2", { id: titleId, children: stop.title }),
                /* @__PURE__ */ jsx("p", { children: stop.caption }),
                /* @__PURE__ */ jsxs("div", { className: "uipack-slide-legend", "aria-label": "Flow colors", children: [
                  /* @__PURE__ */ jsx("span", { "data-tone": "request", children: "Request" }),
                  /* @__PURE__ */ jsx("span", { "data-tone": "response", children: "Response" }),
                  /* @__PURE__ */ jsx("span", { "data-tone": "change", children: "Change" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            SceneViewport,
            {
              story,
              stopId: stop.id,
              theme,
              motion,
              paused: externalPaused ?? paused,
              renderMode: diagram ? "diagram" : renderMode,
              onSettled
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "nav",
          {
            className: "uipack-slide-player__navigation",
            "aria-label": "Presentation stops",
            children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-label": "Previous stop",
                  disabled: index === 0,
                  onClick: () => navigate(index - 1),
                  children: "\u2190 Previous"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "uipack-slide-player__stops", children: story.stops.map((s, i) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-label": `Go to ${s.title}`,
                  "aria-current": index === i ? "step" : void 0,
                  title: s.title,
                  onClick: () => navigate(i),
                  children: String(i + 1).padStart(2, "0")
                },
                s.id
              )) }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-label": "Next stop",
                  disabled: index === story.stops.length - 1,
                  onClick: () => navigate(index + 1),
                  children: "Next \u2192"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxs("footer", { className: "uipack-slide-player__footer", children: [
          /* @__PURE__ */ jsx("span", { children: footer ?? "UIPACK / Spatial stories" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "\u2190 \u2192 to navigate ",
            /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\xB7" }),
            " ",
            reduced ? "Reduced motion" : "Click any stop to jump"
          ] })
        ] }),
        stop.notes && /* @__PURE__ */ jsxs("details", { className: "uipack-slide-player__notes", children: [
          /* @__PURE__ */ jsx("summary", { children: "Presenter notes" }),
          /* @__PURE__ */ jsx("p", { children: stop.notes })
        ] })
      ]
    }
  );
}
function SlidePlayer(props) {
  const errors = validateSlideStory(props.story);
  if (errors.length)
    return /* @__PURE__ */ jsxs("div", { role: "alert", className: "uipack-slide-error", children: [
      "Invalid slide story: ",
      errors.join(" ")
    ] });
  return /* @__PURE__ */ jsx(Player, { ...props }, props.story.id);
}

// src/slides/stories.ts
var harnessDive = {
  id: "harness-dive",
  title: "Inside the agent harness",
  description: "Enter the boundary. Follow the context, tools, and checks around a model.",
  nodes: [
    {
      id: "harness",
      label: "Agent harness",
      position: [0, 0, 0],
      size: [9, 4, 6],
      kind: "boundary"
    },
    {
      id: "input",
      label: "Request",
      detail: "A goal enters",
      position: [-6.5, 0, 0],
      size: [1.6, 0.65, 1],
      tone: "request"
    },
    {
      id: "context",
      label: "Context",
      detail: "Instructions + state",
      position: [-2.8, 0, 0.5],
      tone: "request"
    },
    {
      id: "model",
      kind: "sphere",
      label: "Model",
      detail: "Proposes the next action",
      position: [0, 0, 0],
      size: [2, 1.3, 1.7],
      tone: "accent"
    },
    {
      id: "memory",
      label: "Memory",
      detail: "Retrieve what matters",
      position: [-2.8, 0, -2],
      kind: "layer",
      tone: "change"
    },
    {
      id: "tools",
      label: "Tools",
      detail: "Bounded capabilities",
      position: [2.8, 0, -2],
      tone: "change"
    },
    {
      id: "checks",
      label: "Checks",
      detail: "Permissions + evidence",
      position: [2.8, 0, 0.8],
      tone: "response"
    },
    {
      id: "output",
      label: "Result",
      detail: "Only after verification",
      position: [6.5, 0, 0],
      size: [1.6, 0.65, 1],
      tone: "response"
    }
  ],
  connections: [
    { id: "request", from: "input", to: "context", tone: "request" },
    { id: "context-model", from: "context", to: "model", tone: "request" },
    { id: "memory-context", from: "memory", to: "context", tone: "change" },
    { id: "model-tools", from: "model", to: "tools", tone: "change" },
    { id: "tools-checks", from: "tools", to: "checks", tone: "response" },
    { id: "model-checks", from: "model", to: "checks", tone: "request" },
    { id: "verified", from: "checks", to: "output", tone: "response" }
  ],
  stops: [
    {
      id: "outside",
      title: "The model lives inside a system.",
      caption: "A harness surrounds the model with context, capabilities, and a boundary for what may leave.",
      camera: { position: [14, 10, 20], target: [0, 0, 0] },
      labels: ["input", "model", "output"],
      nodes: {
        context: { opacity: 0.2 },
        memory: { opacity: 0.2 },
        tools: { opacity: 0.2 },
        checks: { opacity: 0.2 }
      },
      notes: "Start with the contract. The model is one component, not the entire agent."
    },
    {
      id: "inside",
      transition: { camera: "dolly", duration: 1.8 },
      title: "Open the harness.",
      caption: "The surrounding machinery becomes visible: context and memory on one side, tools and checks on the other.",
      camera: { position: [8, 9, 13], target: [0, 0, -0.4] },
      labels: ["context", "model", "memory", "tools", "checks"],
      nodes: {
        harness: { opacity: 0.12, scale: 1.12 },
        input: { opacity: 0.12 },
        output: { opacity: 0.12 }
      }
    },
    {
      id: "context",
      title: "Give the model the right context.",
      caption: "Instructions and retrieved memory shape the next decision. More context is useful only when it is relevant.",
      camera: { position: [-5, 7, 10], target: [-1.4, 0, -0.6] },
      labels: ["context", "model", "memory"],
      activeConnections: ["memory-context", "context-model"],
      nodes: {
        harness: { opacity: 0.05 },
        input: { opacity: 0.08 },
        output: { opacity: 0.08 },
        tools: { opacity: 0.16 },
        checks: { opacity: 0.16 }
      }
    },
    {
      id: "action",
      title: "A proposal becomes a tool call.",
      caption: "The model chooses an action; the harness supplies the capability and records what actually happened.",
      camera: { position: [8, 6, 9], target: [1.2, 0, -0.5] },
      labels: ["model", "tools", "checks"],
      activeConnections: ["model-tools", "tools-checks", "model-checks"],
      nodes: {
        harness: { opacity: 0.05 },
        input: { opacity: 0.08 },
        output: { opacity: 0.12 },
        context: { opacity: 0.14 },
        memory: { opacity: 0.14 }
      }
    },
    {
      id: "result",
      title: "Evidence decides what leaves.",
      caption: "A completed action is checked before it becomes a result. The boundary belongs to the harness.",
      camera: { position: [8, 6, 15], target: [3, 0, 0.3] },
      labels: ["model", "checks", "output"],
      activeConnections: ["model-checks", "verified"],
      nodes: {
        harness: { opacity: 0.14 },
        input: { opacity: 0.1 },
        context: { opacity: 0.14 },
        memory: { opacity: 0.14 },
        tools: { opacity: 0.18 }
      }
    }
  ]
};
var retrievalLayers = {
  id: "retrieval-layers",
  title: "A dive through retrieval",
  description: "Explode the knowledge stack, then follow a question into evidence and an answer.",
  nodes: [
    {
      id: "sources",
      label: "Sources",
      detail: "Documents + records",
      position: [0, -2.2, 0],
      size: [7, 0.25, 4.5],
      kind: "layer",
      tone: "neutral"
    },
    {
      id: "index",
      label: "Index",
      detail: "Chunks + embeddings",
      position: [0, -0.9, 0],
      size: [6.3, 0.25, 4],
      kind: "layer",
      tone: "change"
    },
    {
      id: "retrieve",
      label: "Retrieve",
      detail: "Find candidate evidence",
      position: [-2, 0.6, 0],
      tone: "request"
    },
    {
      id: "rank",
      label: "Rerank",
      detail: "Keep the relevant pieces",
      position: [2, 0.6, 0],
      tone: "change"
    },
    {
      id: "question",
      label: "Question",
      detail: "What needs answering?",
      position: [-4.8, 2.1, 0],
      tone: "request"
    },
    {
      id: "answer",
      label: "Answer",
      detail: "Grounded in evidence",
      position: [3, 2.5, 0],
      tone: "response"
    }
  ],
  connections: [
    { id: "ingest", from: "sources", to: "index", tone: "change" },
    { id: "ask", from: "question", to: "retrieve", tone: "request" },
    { id: "lookup", from: "index", to: "retrieve", tone: "response" },
    { id: "rank", from: "retrieve", to: "rank", tone: "change" },
    { id: "answer", from: "rank", to: "answer", tone: "response" }
  ],
  stops: [
    {
      id: "stack",
      title: "Knowledge has layers.",
      caption: "Sources, an index, and a retrieval path sit beneath every grounded answer.",
      camera: { position: [12, 9, 17], target: [0, 0, 0] },
      labels: ["sources", "index", "question", "answer"]
    },
    {
      id: "explode",
      transition: { stagger: 0.08, duration: 1.5 },
      title: "Separate storage from selection.",
      caption: "The index makes evidence findable. Retrieval and ranking decide what the model will actually see.",
      camera: { position: [11, 7, 15], target: [0, 0.1, 0] },
      nodes: {
        sources: { position: [0, -3.3, 0] },
        index: { position: [0, -1.5, 0] },
        retrieve: { position: [-2.3, 0.7, 0] },
        rank: { position: [2.3, 0.7, 0] },
        question: { opacity: 0.15 },
        answer: { position: [3, 3, 0], opacity: 0.15 }
      },
      labels: ["sources", "index", "retrieve", "rank"],
      activeConnections: ["ingest", "lookup"]
    },
    {
      id: "query",
      title: "Trace one question.",
      caption: "A query finds candidates; ranking narrows them to the evidence worth carrying forward.",
      camera: { position: [-8, 7, 13], target: [-0.4, 0.8, 0] },
      labels: ["question", "retrieve", "rank"],
      activeConnections: ["ask", "lookup", "rank"],
      nodes: {
        sources: { opacity: 0.13 },
        index: { opacity: 0.35 },
        answer: { opacity: 0.2 }
      }
    },
    {
      id: "grounded",
      title: "Bring the evidence back up.",
      caption: "The answer depends on selected evidence, not merely on having a large collection of documents.",
      camera: { position: [8, 6, 12], target: [1, 1.2, 0] },
      labels: ["rank", "answer", "index"],
      activeConnections: ["answer"],
      nodes: {
        sources: { opacity: 0.12 },
        question: { opacity: 0.12 },
        retrieve: { opacity: 0.25 }
      }
    }
  ]
};
var parallelAgents = {
  id: "parallel-agents",
  title: "Fan out. Bring evidence back.",
  description: "Turn a single task into parallel investigations, then converge on a reviewed result.",
  nodes: [
    {
      id: "goal",
      label: "Goal",
      detail: "One clear outcome",
      position: [-6, 0, 0],
      tone: "request"
    },
    {
      id: "planner",
      label: "Coordinator",
      detail: "Bounded assignments",
      position: [-3, 0, 0],
      tone: "accent"
    },
    {
      id: "research",
      label: "Research",
      detail: "Sources + facts",
      position: [0, 0, 0],
      tone: "request"
    },
    {
      id: "build",
      label: "Build",
      detail: "An inspectable change",
      position: [0, 0, 0],
      tone: "change"
    },
    {
      id: "review",
      label: "Review",
      detail: "Independent checks",
      position: [0, 0, 0],
      tone: "response"
    },
    {
      id: "merge",
      label: "Synthesis",
      detail: "Resolve disagreements",
      position: [3.6, 0, 0],
      tone: "accent"
    },
    {
      id: "result",
      label: "Result",
      detail: "Evidence attached",
      position: [6.5, 0, 0],
      tone: "response"
    }
  ],
  connections: [
    { id: "goal", from: "goal", to: "planner", tone: "request" },
    ...["research", "build", "review"].flatMap((id, i) => [
      {
        id: `out-${id}`,
        from: "planner",
        to: id,
        tone: ["request", "change", "response"][i]
      },
      {
        id: `in-${id}`,
        from: id,
        to: "merge",
        tone: ["request", "change", "response"][i]
      }
    ]),
    { id: "result", from: "merge", to: "result", tone: "response" }
  ],
  stops: [
    {
      id: "goal",
      title: "Start with a bounded goal.",
      caption: "A coordinator owns the outcome and splits only the work that can proceed independently.",
      camera: { position: [10, 9, 19], target: [0, 0, 0] },
      labels: ["goal", "planner", "result"],
      activeConnections: ["goal"],
      nodes: {
        research: { opacity: 0 },
        build: { opacity: 0 },
        review: { opacity: 0 },
        merge: { opacity: 0.25 }
      }
    },
    {
      id: "fanout",
      transition: { stagger: 0.07, duration: 1.5 },
      title: "Give independent work its own lane.",
      caption: "Research, implementation, and review spread into separate lanes with explicit responsibilities.",
      camera: { position: [10, 11, 18], target: [0, 0, 0] },
      labels: ["planner", "research", "build", "review", "merge"],
      activeConnections: ["out-research", "out-build", "out-review"],
      nodes: {
        research: { position: [0, 0, -3.4] },
        build: { position: [0, 0, 0] },
        review: { position: [0, 0, 3.4] },
        goal: { opacity: 0.18 },
        result: { opacity: 0.18 }
      }
    },
    {
      id: "inspect",
      title: "Look across the lanes.",
      caption: "A change and its review are different artifacts. Independent evidence is useful precisely because it can disagree.",
      camera: { position: [-3, 12, 13], target: [0, 0, 0] },
      labels: ["research", "build", "review"],
      nodes: {
        research: { position: [-2.8, 0, -2] },
        build: { position: [0, 1.2, 0] },
        review: { position: [2.8, 0, 2] },
        goal: { opacity: 0.1 },
        planner: { opacity: 0.15 },
        merge: { opacity: 0.15 },
        result: { opacity: 0.1 }
      }
    },
    {
      id: "converge",
      title: "Converge on one reviewed result.",
      caption: "The coordinator reconciles the evidence. More agents do not remove the need for one accountable decision.",
      camera: { position: [11, 8, 16], target: [2, 0, 0] },
      labels: ["research", "build", "review", "merge", "result"],
      activeConnections: ["in-research", "in-build", "in-review", "result"],
      nodes: {
        research: { position: [0, 0, -2.6] },
        build: { position: [0, 0, 0] },
        review: { position: [0, 0, 2.6] },
        goal: { opacity: 0.08 },
        planner: { opacity: 0.15 }
      }
    }
  ]
};
var quarterTurn = {
  id: "quarter-turn",
  title: "One system, four perspectives",
  description: "A constant-radius quarter turn reveals a different architectural slice without rearranging the system.",
  nodes: [
    {
      id: "core",
      label: "Runtime",
      position: [0, 0, 0],
      kind: "sphere",
      size: [2, 2, 2],
      tone: "accent"
    },
    {
      id: "api",
      label: "Interface",
      detail: "The caller's view",
      position: [0, 0, 3.8],
      tone: "request"
    },
    {
      id: "tools",
      label: "Execution",
      detail: "Capabilities + actions",
      position: [3.8, 0, 0],
      tone: "change"
    },
    {
      id: "data",
      label: "State",
      detail: "Memory + persistence",
      position: [0, 0, -3.8],
      tone: "response"
    },
    {
      id: "policy",
      label: "Control",
      detail: "Permissions + checks",
      position: [-3.8, 0, 0],
      tone: "neutral"
    }
  ],
  connections: ["api", "tools", "data", "policy"].map((id) => ({
    id,
    from: id,
    to: "core",
    tone: "accent"
  })),
  stops: [
    {
      id: "front",
      title: "Start with the interface.",
      caption: "One architecture stays in place. Each turn changes what you explain.",
      camera: { position: [0, 10, 19], target: [0, 0, 0] },
      labels: ["api", "core"]
    },
    {
      id: "right",
      title: "Turn 90\xB0 to execution.",
      caption: "Keep the runtime as the anchor while capabilities come to the foreground.",
      camera: { position: [19, 10, 0], target: [0, 0, 0] },
      labels: ["tools", "core"],
      activeConnections: ["tools"]
    },
    {
      id: "back",
      title: "Another turn reveals state.",
      caption: "The same system, viewed through its memory and persistence boundary.",
      camera: { position: [0, 10, -19], target: [0, 0, 0] },
      labels: ["data", "core"],
      activeConnections: ["data"]
    },
    {
      id: "left",
      title: "Finish with control.",
      caption: "Policy decides which actions may cross the runtime boundary.",
      camera: { position: [-19, 10, 0], target: [0, 0, 0] },
      labels: ["policy", "core"],
      activeConnections: ["policy"]
    }
  ]
};
var stagedAssembly = {
  id: "staged-assembly",
  title: "Build the explanation in layers",
  description: "A fixed camera lets components arrive in sequence, then separates them for inspection.",
  nodes: [
    {
      id: "data",
      label: "Evidence",
      detail: "A reliable foundation",
      position: [0, -2, 0],
      size: [6, 0.3, 4],
      kind: "layer",
      tone: "response"
    },
    {
      id: "tools",
      label: "Capabilities",
      detail: "Bounded operations",
      position: [0, -0.6, 0],
      size: [5, 0.3, 3.4],
      kind: "layer",
      tone: "change"
    },
    {
      id: "runtime",
      label: "Runtime",
      detail: "Coordinate the work",
      position: [0, 0.8, 0],
      size: [4, 0.3, 2.8],
      kind: "layer",
      tone: "request"
    },
    {
      id: "experience",
      label: "Experience",
      detail: "The user's outcome",
      position: [0, 2.2, 0],
      size: [3, 0.3, 2.2],
      kind: "layer",
      tone: "accent"
    }
  ],
  connections: [],
  stops: [
    {
      id: "foundation",
      title: "Begin with evidence.",
      caption: "Introduce the foundation before adding the machinery above it.",
      camera: { position: [11, 8, 17], target: [0, 0, 0] },
      labels: ["data"],
      nodes: {
        tools: { position: [0, 5, 0], opacity: 0 },
        runtime: { position: [0, 6, 0], opacity: 0 },
        experience: { position: [0, 7, 0], opacity: 0 }
      }
    },
    {
      id: "assemble",
      title: "Build up the capabilities.",
      caption: "Each layer arrives in order. The camera stays still so the assembly is the only movement.",
      camera: { position: [11, 8, 17], target: [0, 0, 0] },
      transition: { stagger: 0.14, duration: 1.7 },
      labels: ["tools", "runtime", "experience"]
    },
    {
      id: "separate",
      title: "Pull apart the responsibilities.",
      caption: "Lift the layers to explain what each owns and where the boundaries sit.",
      camera: { position: [11, 8, 17], target: [0, 0, 0] },
      transition: { stagger: 0.1 },
      nodes: {
        data: { position: [0, -3, 0] },
        tools: { position: [0, -1, 0] },
        runtime: { position: [0, 1.2, 0] },
        experience: { position: [0, 3.4, 0] }
      }
    }
  ]
};
var architectureShift = {
  id: "architecture-shift",
  title: "From handoffs to a shared workflow",
  description: "Use a spatial before-and-after: preserve component identities while reorganizing their relationships.",
  nodes: [
    {
      id: "request",
      label: "Request",
      position: [-4.5, 0, 0],
      tone: "request"
    },
    { id: "plan", label: "Plan", position: [-1.5, 0, 0], tone: "accent" },
    { id: "execute", label: "Execute", position: [1.5, 0, 0], tone: "change" },
    { id: "verify", label: "Verify", position: [4.5, 0, 0], tone: "response" },
    {
      id: "state",
      label: "Shared state",
      detail: "Context + evidence",
      position: [0, -0.5, 0],
      kind: "sphere",
      tone: "accent"
    }
  ],
  connections: [
    { id: "a", from: "request", to: "plan", tone: "request" },
    { id: "b", from: "plan", to: "execute", tone: "change" },
    { id: "c", from: "execute", to: "verify", tone: "response" },
    ...["request", "plan", "execute", "verify"].map((id) => ({
      id,
      from: id,
      to: "state",
      tone: "accent"
    }))
  ],
  stops: [
    {
      id: "before",
      title: "A chain of handoffs.",
      caption: "Each stage passes its output onward. Context has to travel with the handoff.",
      camera: { position: [5, 10, 20], target: [0, 0, 0] },
      nodes: { state: { opacity: 0 } },
      labels: ["request", "plan", "execute", "verify"],
      activeConnections: ["a", "b", "c"]
    },
    {
      id: "after",
      title: "Organize around shared state.",
      caption: "The same components gather around a common record of progress and evidence.",
      camera: { position: [5, 10, 20], target: [0, 0, 0] },
      transition: { duration: 2, stagger: 0.06 },
      nodes: {
        request: { position: [-3.4, 0, 0] },
        plan: { position: [0, 0, -3.4] },
        execute: { position: [3.4, 0, 0] },
        verify: { position: [0, 0, 3.4] }
      },
      labels: ["request", "plan", "execute", "verify", "state"],
      activeConnections: ["request", "plan", "execute", "verify"]
    },
    {
      id: "focus",
      title: "Keep the evidence in view.",
      caption: "Move closer to the shared record while preserving the surrounding responsibilities.",
      camera: { position: [3, 8, 13], target: [0, -0.5, 0] },
      transition: { camera: "dolly", duration: 1.8 },
      nodes: {
        request: { position: [-3.4, 0, 0], opacity: 0.25 },
        plan: { position: [0, 0, -3.4], opacity: 0.25 },
        execute: { position: [3.4, 0, 0], opacity: 0.25 },
        verify: { position: [0, 0, 3.4], opacity: 0.25 }
      },
      labels: ["state"]
    }
  ]
};
var slideStories = [
  harnessDive,
  retrievalLayers,
  parallelAgents,
  quarterTurn,
  stagedAssembly,
  architectureShift
];
export {
  SlidePlayer,
  SlideScene,
  architectureShift,
  clampStop,
  harnessDive,
  parallelAgents,
  quarterTurn,
  resolveNodePose,
  retrievalLayers,
  slidePalettes,
  slideStories,
  stagedAssembly,
  validateSlideStory
};
//# sourceMappingURL=slides.js.map