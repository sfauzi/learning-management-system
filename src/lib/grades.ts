import type { GradeItem } from "@/lib/types";

export type GradeCell = {
  item: GradeItem;
  grade: number | null;
  max: number;
  weight: number;
  feedback: string | null;
};

export type CourseGrade = {
  cells: GradeCell[];
  final: number;
  letter: string;
  totalWeight: number;
};

/** Indonesian letter-grade scale used by Telkom University. */
export function letterFor(score: number): string {
  if (score >= 85) return "A";
  if (score >= 75) return "AB";
  if (score >= 70) return "B";
  if (score >= 65) return "BC";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
}

export function letterTone(letter: string) {
  switch (letter) {
    case "A":
    case "AB":
      return "success";
    case "B":
    case "BC":
      return "info";
    case "C":
      return "warn";
    default:
      return "danger";
  }
}

/**
 * Weighted final score: sum(grade / max * weight) / sum(weight) * 100.
 * Items without a grade contribute 0, exactly like the reference implementation.
 */
export function computeCourseGrade(
  items: GradeItem[],
  grades: { grade_item_id: number; grade: number | null; feedback: string | null }[]
): CourseGrade {
  const byItem = new Map(grades.map((g) => [g.grade_item_id, g]));
  const totalWeight = items.reduce((sum, i) => sum + Number(i.weight), 0) || 1;

  const cells: GradeCell[] = items.map((item) => {
    const g = byItem.get(item.id);
    return {
      item,
      grade: g?.grade ?? null,
      max: Number(item.max_grade),
      weight: Number(item.weight),
      feedback: g?.feedback ?? null,
    };
  });

  let sum = 0;
  for (const cell of cells) {
    if (cell.grade !== null && cell.max > 0) {
      sum += (cell.grade / cell.max) * cell.weight;
    }
  }
  const final = Number(((sum / totalWeight) * 100).toFixed(2));

  return { cells, final, letter: letterFor(final), totalWeight };
}
