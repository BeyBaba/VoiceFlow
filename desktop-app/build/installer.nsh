!macro customInstall
  ; Refresh Windows icon cache after installation
  System::Call 'shell32::SHChangeNotify(i 0x8000000, i 0x1000, i 0, i 0)'
  ; Run ie4uinit to refresh icons
  nsExec::Exec 'ie4uinit.exe -show'
!macroend
