"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }




var _chunkGUY7V4IQcjs = require('./chunk-GUY7V4IQ.cjs');


var _chunkNFU4EWVXcjs = require('./chunk-NFU4EWVX.cjs');


var _chunkYMPVJRTJcjs = require('./chunk-YMPVJRTJ.cjs');

// src/slides/SlidePlayer.tsx





var _react = require('react');
var _jsxruntime = require('react/jsx-runtime');
function Diagram({ story, stop }) {
  const visible = story.nodes.filter(
    (n) => n.kind !== "boundary" && _chunkGUY7V4IQcjs.resolveNodePose.call(void 0, n, stop).opacity > 0.25
  );
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-slide-diagram", "data-testid": "slide-diagram", children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "uipack-slide-diagram__heading", children: "Diagram view" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "uipack-slide-diagram__nodes", children: visible.map((n) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { "data-tone": n.tone, children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "strong", { children: n.label }),
      " ",
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: n.detail })
    ] }, n.id)) }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "ul", { "aria-label": "Highlighted connections", children: story.connections.filter((c) => _optionalChain([stop, 'access', _ => _.activeConnections, 'optionalAccess', _2 => _2.includes, 'call', _3 => _3(c.id)])).map((c) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "li", { children: [
      _optionalChain([story, 'access', _4 => _4.nodes, 'access', _5 => _5.find, 'call', _6 => _6((n) => n.id === c.from), 'optionalAccess', _7 => _7.label]),
      " ",
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { "aria-label": "to", children: "\u2192" }),
      " ",
      _optionalChain([story, 'access', _8 => _8.nodes, 'access', _9 => _9.find, 'call', _10 => _10((n) => n.id === c.to), 'optionalAccess', _11 => _11.label])
    ] }, c.id)) })
  ] });
}
function SceneViewport({
  story,
  stopId,
  zoom = 1,
  theme = "dark",
  motion = "auto",
  paused = false,
  renderMode = "auto",
  className = "",
  onSettled
}) {
  const host = _react.useRef.call(void 0, null), labels = _react.useRef.call(void 0, null), runtime = _react.useRef.call(void 0, );
  const prefersReduced = _chunkYMPVJRTJcjs.usePrefersReducedMotion.call(void 0, );
  const reduced = motion === "none" || prefersReduced;
  const stop = _nullishCoalesce(story.stops.find((s) => s.id === stopId), () => ( story.stops[0]));
  const latest = _react.useRef.call(void 0, { stop, reduced, paused, onSettled });
  latest.current = { stop, reduced, paused, onSettled };
  const [status, setStatus] = _react.useState.call(void 0, 
    "loading"
  );
  const [selected, setSelected] = _react.useState.call(void 0, null);
  const [failed, setFailed] = _react.useState.call(void 0, false);
  const [settled, setSettled] = _react.useState.call(void 0, "");
  const [transitioning, setTransitioning] = _react.useState.call(void 0, false);
  _react.useEffect.call(void 0, () => {
    let cancelled = false;
    if (renderMode === "diagram" || failed) {
      setStatus("fallback");
      setTransitioning(false);
      setSettled(latest.current.stop.id);
      return;
    }
    setStatus("loading");
    void Promise.resolve().then(() => _interopRequireWildcard(require("./renderer-I3OQMLUB.cjs"))).then(({ createSlideScene }) => {
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
              _optionalChain([latest, 'access', _12 => _12.current, 'access', _13 => _13.onSettled, 'optionalCall', _14 => _14(id)]);
            }
          },
          setSelected
        );
        runtime.current.setPaused(latest.current.paused);
        setStatus("ready");
      } catch (e2) {
        if (!cancelled) setFailed(true);
      }
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
      _optionalChain([runtime, 'access', _15 => _15.current, 'optionalAccess', _16 => _16.dispose, 'call', _17 => _17()]);
      runtime.current = void 0;
    };
  }, [story, theme, renderMode, failed]);
  _react.useEffect.call(void 0, () => {
    if (renderMode === "diagram" || failed) {
      setSettled(stop.id);
      setTransitioning(false);
      _optionalChain([onSettled, 'optionalCall', _18 => _18(stop.id)]);
      return;
    }
    if (runtime.current) {
      setTransitioning(!reduced);
      runtime.current.goTo(stop, reduced);
    }
  }, [stop, renderMode, failed]);
  _react.useEffect.call(void 0, () => {
    _optionalChain([runtime, 'access', _19 => _19.current, 'optionalAccess', _20 => _20.setReducedMotion, 'call', _21 => _21(reduced)]);
  }, [reduced]);
  _react.useEffect.call(void 0, () => {
    _optionalChain([runtime, 'access', _22 => _22.current, 'optionalAccess', _23 => _23.setPaused, 'call', _24 => _24(paused)]);
  }, [paused]);
  _react.useEffect.call(void 0, () => {
    _optionalChain([runtime, 'access', _25 => _25.current, 'optionalAccess', _26 => _26.setSelected, 'call', _27 => _27(selected)]);
  }, [selected, status]);
  _react.useEffect.call(void 0, () => {
    _optionalChain([runtime, 'access', _28 => _28.current, 'optionalAccess', _29 => _29.setZoom, 'call', _30 => _30(zoom)]);
  }, [zoom, status]);
  _react.useEffect.call(void 0, () => {
    setSelected(null);
  }, [stop.id]);
  const chosen = story.nodes.find((n) => n.id === selected);
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
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
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "div",
          {
            className: "uipack-slide-scene__webgl",
            ref: host,
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { ref: labels, className: "uipack-slide-labels", children: story.nodes.map((n) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          "button",
          {
            type: "button",
            "aria-pressed": selected === n.id,
            onClick: () => setSelected(selected === n.id ? null : n.id),
            "data-node": n.id,
            "data-tone": n.tone,
            className: "uipack-slide-label",
            style: { visibility: "hidden" },
            children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "strong", { children: n.label }),
              " ",
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: n.detail })
            ]
          },
          n.id
        )) }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-slide-inspect", children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "label", { children: [
            "Inspect component",
            " ",
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
              "select",
              {
                "aria-label": "Inspect component",
                value: _nullishCoalesce(selected, () => ( "")),
                onChange: (e) => setSelected(e.target.value || null),
                children: [
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "option", { value: "", children: "Choose a component" }),
                  story.nodes.filter(
                    (n) => n.kind !== "boundary" && _chunkGUY7V4IQcjs.resolveNodePose.call(void 0, n, stop).opacity > 0.25
                  ).map((n) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "option", { value: n.id, children: n.label }, n.id))
                ]
              }
            )
          ] }),
          chosen && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { role: "status", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "strong", { children: chosen.label }),
            chosen.detail && ` \xB7 ${chosen.detail}`,
            " ",
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "button", { type: "button", onClick: () => setSelected(null), children: "Clear selection" })
          ] })
        ] }),
        status !== "ready" && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Diagram, { story, stop }),
        status === "ready" && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "uipack-slide-scene__badge", children: [
          "Live 3D ",
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { "aria-hidden": "true", children: "\xB7" }),
          " ",
          reduced ? "Reduced motion" : "Authored camera"
        ] }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "uipack-slide-sr", children: story.nodes.filter(
          (n) => n.kind !== "boundary" && _chunkGUY7V4IQcjs.resolveNodePose.call(void 0, n, stop).opacity > 0.25
        ).map((n) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { children: [
          n.label,
          ": ",
          n.detail
        ] }, n.id)) })
      ]
    }
  );
}
function SlideScene(props) {
  const [canvas, setCanvas] = _react.useState.call(void 0, false);
  const [zoom, setZoom] = _react.useState.call(void 0, 1);
  const opener = _react.useRef.call(void 0, null);
  const errors = _chunkGUY7V4IQcjs.validateSlideStory.call(void 0, props.story);
  if (errors.length)
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { role: "alert", className: "uipack-slide-error", children: [
      "Invalid slide story: ",
      errors.join(" ")
    ] });
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _chunkNFU4EWVXcjs.CanvasView,
    {
      restoreFocus: () => _optionalChain([opener, 'access', _31 => _31.current, 'optionalAccess', _32 => _32.focus, 'call', _33 => _33()]),
      open: canvas,
      onClose: () => {
        setCanvas(false);
        setZoom(1);
      },
      title: props.story.title,
      theme: _nullishCoalesce(props.theme, () => ( "dark")),
      zoom: { value: zoom, min: 0.75, max: 2, onChange: setZoom },
      children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-scene-card", "data-theme": _nullishCoalesce(props.theme, () => ( "dark")), children: [
        !canvas && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "button",
          {
            className: "uipack-scene-card__open",
            ref: opener,
            type: "button",
            onClick: () => setCanvas(true),
            children: "Open canvas"
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          SceneViewport,
          {
            ...props,
            zoom: canvas ? zoom : props.zoom
          },
          props.story.id
        )
      ] })
    }
  );
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
  const [internal, setInternal] = _react.useState.call(void 0, initial), [paused, setPaused] = _react.useState.call(void 0, false), [present, setPresent] = _react.useState.call(void 0, false), [diagram, setDiagram] = _react.useState.call(void 0, false), [canvas, setCanvas] = _react.useState.call(void 0, false), [zoom, setZoom] = _react.useState.call(void 0, 1);
  const reduced = _chunkYMPVJRTJcjs.usePrefersReducedMotion.call(void 0, ) || motion === "none";
  const opener = _react.useRef.call(void 0, null);
  const root = _react.useRef.call(void 0, null);
  const titleId = _react.useId.call(void 0, );
  const index = stopId === void 0 ? _chunkGUY7V4IQcjs.clampStop.call(void 0, internal, story.stops.length) : Math.max(
    0,
    story.stops.findIndex((s) => s.id === stopId)
  );
  const stop = story.stops[index];
  const navigate = (value) => {
    const next = _chunkGUY7V4IQcjs.clampStop.call(void 0, value, story.stops.length);
    if (stopId === void 0) setInternal(next);
    if (next !== index) _optionalChain([onStopChange, 'optionalCall', _34 => _34(story.stops[next].id)]);
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
  _react.useEffect.call(void 0, () => {
    if (!present) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    _optionalChain([root, 'access', _35 => _35.current, 'optionalAccess', _36 => _36.focus, 'call', _37 => _37()]);
    return () => {
      document.body.style.overflow = previous;
    };
  }, [present]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _chunkNFU4EWVXcjs.CanvasView,
    {
      restoreFocus: () => _optionalChain([opener, 'access', _38 => _38.current, 'optionalAccess', _39 => _39.focus, 'call', _40 => _40()]),
      open: canvas,
      onClose: () => {
        setCanvas(false);
        setZoom(1);
      },
      title: story.title,
      theme,
      zoom: { value: zoom, min: 0.75, max: 2, onChange: setZoom },
      children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
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
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-slide-player__top", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: story.title }),
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { children: [
                !canvas && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  "button",
                  {
                    ref: opener,
                    type: "button",
                    onClick: () => {
                      setPresent(false);
                      setCanvas(true);
                    },
                    children: "Open canvas"
                  }
                ),
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  "button",
                  {
                    type: "button",
                    onClick: () => setDiagram((v) => !v),
                    "aria-pressed": diagram,
                    children: diagram ? "3D view" : "Diagram view"
                  }
                ),
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  "button",
                  {
                    type: "button",
                    disabled: reduced || externalPaused !== void 0,
                    onClick: () => setPaused((v) => !v),
                    "aria-pressed": paused,
                    children: paused ? "Resume flow" : "Pause flow"
                  }
                ),
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  "button",
                  {
                    type: "button",
                    disabled: canvas,
                    onClick: () => setPresent((v) => !v),
                    "aria-pressed": present,
                    children: present ? "Exit presentation" : "Present"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-slide-player__body", children: [
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                "header",
                {
                  className: "uipack-slide-player__copy",
                  "aria-live": "polite",
                  "aria-atomic": "true",
                  children: [
                    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "uipack-slide-player__count", children: [
                      String(index + 1).padStart(2, "0"),
                      " /",
                      " ",
                      String(story.stops.length).padStart(2, "0")
                    ] }),
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "h2", { id: titleId, children: stop.title }),
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: stop.caption }),
                    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-slide-legend", "aria-label": "Flow colors", children: [
                      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { "data-tone": "request", children: "Request" }),
                      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { "data-tone": "response", children: "Response" }),
                      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { "data-tone": "change", children: "Change" })
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                SceneViewport,
                {
                  story,
                  zoom,
                  stopId: stop.id,
                  theme,
                  motion,
                  paused: _nullishCoalesce(externalPaused, () => ( paused)),
                  renderMode: diagram ? "diagram" : renderMode,
                  onSettled
                }
              )
            ] }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
              "nav",
              {
                className: "uipack-slide-player__navigation",
                "aria-label": "Presentation stops",
                children: [
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                    "button",
                    {
                      type: "button",
                      "aria-label": "Previous stop",
                      disabled: index === 0,
                      onClick: () => navigate(index - 1),
                      children: "\u2190 Previous"
                    }
                  ),
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "uipack-slide-player__stops", children: story.stops.map((s, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
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
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "footer", { className: "uipack-slide-player__footer", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: _nullishCoalesce(footer, () => ( "UIPACK / Spatial stories")) }),
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { children: [
                "\u2190 \u2192 to navigate ",
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { "aria-hidden": "true", children: "\xB7" }),
                " ",
                reduced ? "Reduced motion" : "Click any stop to jump"
              ] })
            ] }),
            stop.notes && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "details", { className: "uipack-slide-player__notes", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "summary", { children: "Presenter notes" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: stop.notes })
            ] })
          ]
        }
      )
    }
  );
}
function SlidePlayer(props) {
  const errors = _chunkGUY7V4IQcjs.validateSlideStory.call(void 0, props.story);
  if (errors.length)
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { role: "alert", className: "uipack-slide-error", children: [
      "Invalid slide story: ",
      errors.join(" ")
    ] });
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Player, { ...props }, props.story.id);
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














exports.SlidePlayer = SlidePlayer; exports.SlideScene = SlideScene; exports.architectureShift = architectureShift; exports.clampStop = _chunkGUY7V4IQcjs.clampStop; exports.harnessDive = harnessDive; exports.parallelAgents = parallelAgents; exports.quarterTurn = quarterTurn; exports.resolveNodePose = _chunkGUY7V4IQcjs.resolveNodePose; exports.retrievalLayers = retrievalLayers; exports.slidePalettes = _chunkGUY7V4IQcjs.slidePalettes; exports.slideStories = slideStories; exports.stagedAssembly = stagedAssembly; exports.validateSlideStory = _chunkGUY7V4IQcjs.validateSlideStory;
