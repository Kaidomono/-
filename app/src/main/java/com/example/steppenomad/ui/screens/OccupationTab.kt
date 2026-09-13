package com.example.steppenomad.ui.screens

import androidx.compose.runtime.Composable
import com.example.steppenomad.model.CareerBranch
import com.example.steppenomad.model.Character

/**
 * Occupation & Careers Tab (Алба, Мэргэжил & Цэргийн Хүч)
 * Dedicated to career progression, clan vocational duties, and horde military recruitment.
 */
@Composable
fun OccupationTab(
    character: Character,
    onPerformAction: (CareerBranch) -> Unit,
    onPromote: (String) -> Unit,
    onRecruitHorde: (Int) -> Unit
) {
    ActivitiesTab(
        character = character,
        onPerformAction = onPerformAction,
        onPromote = onPromote,
        onRecruitHorde = onRecruitHorde
    )
}
