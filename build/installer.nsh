; ============================================================
; Voxelio Player — NSIS custom installer script
; ============================================================
; Registers the `voxelio://` protocol so websites can launch
; the app via custom URLs.
; ============================================================

!macro customInstall
  ; ---- Register voxelio:// protocol for current user ----
  WriteRegStr HKCU "Software\Classes\voxelio" "" "URL:Voxelio Protocol"
  WriteRegStr HKCU "Software\Classes\voxelio" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\voxelio\DefaultIcon" "" "$INSTDIR\Voxelio.exe,1"
  WriteRegStr HKCU "Software\Classes\voxelio\shell\open\command" "" '"$INSTDIR\Voxelio.exe" "%1"'

  ; ---- Also register for all users (if admin) ----
  WriteRegStr HKLM "Software\Classes\voxelio" "" "URL:Voxelio Protocol"
  WriteRegStr HKLM "Software\Classes\voxelio" "URL Protocol" ""
  WriteRegStr HKLM "Software\Classes\voxelio\DefaultIcon" "" "$INSTDIR\Voxelio.exe,1"
  WriteRegStr HKLM "Software\Classes\voxelio\shell\open\command" "" '"$INSTDIR\Voxelio.exe" "%1"'
!macroend

!macro customUnInstall
  ; ---- Remove the protocol on uninstall ----
  DeleteRegKey HKCU "Software\Classes\voxelio"
  DeleteRegKey HKLM "Software\Classes\voxelio"
!macroend