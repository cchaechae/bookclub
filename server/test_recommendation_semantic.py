"""Tests for embedding-based recommendation helpers (no live OpenAI)."""

from recommendation_semantic import cosine_similarity, user_profile_row_to_text


def test_cosine_identical_unit_vectors() -> None:
    a = [1.0, 0.0, 0.0]
    b = [1.0, 0.0, 0.0]
    assert abs(cosine_similarity(a, b) - 1.0) < 1e-9


def test_cosine_orthogonal() -> None:
    a = [1.0, 0.0]
    b = [0.0, 1.0]
    assert abs(cosine_similarity(a, b) - 0.0) < 1e-9


def test_user_profile_row_to_text() -> None:
    t = user_profile_row_to_text(
        {
            "preferred_genres": ["sci-fi", "literary"],
            "reading_goal": "discussion",
            "cadence": "weekly",
            "freetext": "no grimdark",
        }
    )
    assert "sci-fi" in t and "discussion" in t and "weekly" in t and "grimdark" in t
