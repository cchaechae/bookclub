"""Pure helpers for onboarding persistence (no Supabase)."""

from onboarding_repository import history_to_ui_messages, last_assistant_reply


def test_history_to_ui_messages_skips_tool_only_assistant():
    history = [
        {"role": "user", "content": "Hi"},
        {"role": "assistant", "content": "Hello!"},
        {"role": "assistant", "tool_calls": [{"id": "1", "type": "function", "function": {"name": "x", "arguments": "{}"}}]},
        {"role": "assistant", "content": "Done."},
    ]
    ui = history_to_ui_messages(history)
    assert [m["role"] for m in ui] == ["user", "assistant", "assistant"]
    assert ui[-1]["text"] == "Done."


def test_last_assistant_reply():
    history = [{"role": "user", "content": "x"}, {"role": "assistant", "content": "last"}]
    assert last_assistant_reply(history) == "last"
