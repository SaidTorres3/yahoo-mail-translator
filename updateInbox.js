(function () {
  function updateInbox() {
    const targetDiv = document.querySelector('.D_F.p_R.k_w.r_P.H_6NIX.c1AVi7a_6UbO.W_6D6F.X_6DEy.N_fq7.ab_C.I4_2tvNsT.n_Z1YKD9t.I_1kC8gG.C_ZkbNhI.is_26ISAR.cZdTOHS_ZXgLQ3[data-test-folder-container="Inbox"]');
    if (targetDiv) {
      targetDiv.click();
    }
  }

  setInterval(() => {
    if (window.location.href === "https://mail.yahoo.com/d/folders/1") {
      updateInbox();
    }
  }, 7000);
})();
