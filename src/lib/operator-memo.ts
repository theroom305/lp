export function shouldRenderOperatorMemo(
  voiceApproved: boolean,
  memo: string,
): boolean {
  return voiceApproved && memo.trim().length > 0;
}
