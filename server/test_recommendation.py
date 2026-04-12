"""Unit tests for recommendation helpers."""

from recommendation import genre_match_score, goal_match_score, total_preference


def test_genre_exact() -> None:
    assert genre_match_score("Historical fiction", "Historical fiction") == 1.0


def test_genre_substring() -> None:
    assert genre_match_score("Thriller", "Crime fiction") >= 0.0


def test_total_preference_readme_shape() -> None:
    # README: 0.3*cadence + 0.5*genre
    assert abs(total_preference(2.0, 0.8) - (0.3 * 2 + 0.5 * 0.8)) < 1e-9


def test_goal_overlap() -> None:
    club = {
        "leader": "A",
        "genre": "g",
        "book": {"title": "T", "summary": "reading circle discussion books weekly"},
    }
    assert goal_match_score("books reading weekly", club) > 0.0
