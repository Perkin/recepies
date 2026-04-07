import { AuthPanel } from './AuthPanel'
import { DeleteRecipeDialog } from './DeleteRecipeDialog'

export function RecipeOverlays({
  authModalMode,
  isAuthBusy,
  onCloseAuth,
  onSignIn,
  onSignUp,
  recipePendingDeletion,
  onCancelDelete,
  onConfirmDelete,
}) {
  return (
    <>
      {authModalMode ? (
        <AuthPanel
          mode={authModalMode}
          isBusy={isAuthBusy}
          onClose={onCloseAuth}
          onSignIn={onSignIn}
          onSignUp={onSignUp}
        />
      ) : null}

      {recipePendingDeletion ? (
        <DeleteRecipeDialog
          recipeTitle={recipePendingDeletion.title}
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
        />
      ) : null}
    </>
  )
}
