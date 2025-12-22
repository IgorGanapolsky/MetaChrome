"""
LangGraph-based orchestrator for our autonomous loop.
Plan:
  kernel_gen -> kernel_bench -> kernel_select -> rag_build -> rag_publish -> eval_monitorability
Tools are thin wrappers over existing scripts to avoid duplication.
"""
from langgraph.graph import StateGraph, END
from typing import TypedDict, Any
import tools


class State(TypedDict, total=False):
    last_result: Any
    history: list


def node(fn):
    def _node(state: State):
        res = fn() if callable(fn) else None
        hist = state.get("history", [])
        hist.append({"step": fn.__name__, "result": res})
        return {"last_result": res, "history": hist}

    return _node


def build_graph():
    g = StateGraph(State)
    g.add_node("kernel_gen", node(tools.kernel_gen))
    g.add_node("kernel_bench", node(tools.kernel_bench))
    g.add_node("kernel_select", node(tools.kernel_select))
    g.add_node("rag_build", node(tools.rag_build))
    g.add_node("rag_publish", node(tools.rag_publish))
    g.add_node("eval_monitorability", node(tools.eval_monitorability))

    g.set_entry_point("kernel_gen")
    g.add_edge("kernel_gen", "kernel_bench")
    g.add_edge("kernel_bench", "kernel_select")
    g.add_edge("kernel_select", "rag_build")
    g.add_edge("rag_build", "rag_publish")
    g.add_edge("rag_publish", "eval_monitorability")
    g.add_edge("eval_monitorability", END)
    return g.compile()


def run_autopilot():
    graph = build_graph()
    final_state = graph.invoke({})
    return final_state


if __name__ == "__main__":
    out = run_autopilot()
    print(out)
