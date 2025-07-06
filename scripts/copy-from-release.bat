@echo off
:: Batch file to copy Tutelar release folder to local Ujigami Install

::Enable access to late binding !variables!
setlocal EnableDelayedExpansion

:: get special chars - ansi usage see https://www.robvanderwoude.com/ansi.php and https://stackoverflow.com/questions/4842424/list-of-ansi-color-escape-sequences
call :calcSpecialChars CR, DEL, ESC

:: # Retrieve the current Window title
for /f "usebackq delims=" %%t in (`powershell -noprofile -c "$Host.UI.RawUI.WindowTitle.Replace(' - %0','').Replace(' %*', '') -replace '[ ]+$', ''"`) do set "prevTitle=%%t"


::set window to 180x50 chars
::mode 180,50 Ugh, this sets the buffer size too
::cls
echo !ESC![37;44mTT Robocopy!ESC![K
echo.
echo !ESC![47;30mCopying Server02 Tutelar released files to c:\Tutelar folder ...!ESC![K!ESC![0m

::set test=1 to verify parameters
set test=0

::cumulative vars to display messages at end
set some=0
set extra=0
set missed=0

if %test% EQU 1 (
   call :copyFiles \\server02\data\tutelar\release\Spiderworks C:\Tutelar\Spiderworks  some extra missed /XD applications pages

   echo some=%some%
   echo extra=%extra%
   echo missed=%missed%

   goto :eof
)

::echo !ESC![46;93mCopying Spiderworks ...%ext%!ESC![K!ESC![0m
call :copyFiles \\Server02\data\tutelar\release\Spiderworks C:\Tutelar\Spiderworks  some extra missed /XD applications pages

call :copyFiles \\Server02\data\tutelar\release\Ujigami C:\Tutelar\Ujigami  some extra missed

call :copyFiles \\Server02\data\tutelar\release\modules C:\Tutelar\modules some extra missed

call :copyFiles \\Server02\data\tutelar\release\apps C:\Tutelar\apps some extra missed


call :copyFiles \\Server02\data\tutelar\release\Spiderworks\applications C:\Tutelar\Spiderworks\applications some extra missed /XD wms


call :copyFiles \\Server02\data\tutelar\release\Spiderworks\pages\home C:\Tutelar\Spiderworks\pages\home some extra missed

call :copyFiles \\Server02\data\tutelar\release\Spiderworks\pages\admin C:\Tutelar\Spiderworks\pages\admin some extra missed

call :copyFiles \\Server02\data\tutelar\release\Spiderworks\pages\production C:\Tutelar\Spiderworks\pages\production some extra missed

call :copyFiles \\Server02\data\tutelar\release\Spiderworks\pages\quality C:\Tutelar\Spiderworks\pages\quality some extra missed

call :copyFiles \\Server02\data\tutelar\release\Spiderworks\pages\webservice C:\Tutelar\Spiderworks\pages\webservice some extra missed

echo.

if %missed% GTR 0 (
   echo !ESC![31;103m                                                      !ESC![0m
   echo !ESC![31;103m   *** WARNING - some files could not be copied ***   !ESC![0m
   echo !ESC![31;103m                                                      !ESC![0m
)
if %some% GTR 0 (
   echo !ESC![46;97mAll new files copied!ESC![K!ESC![0m
)
if %some% EQU 0 (
   echo !ESC![30;106m                                                      !ESC![0m
   echo !ESC![30;106m      *** WARNING - no new files found ***            !ESC![0m
   echo !ESC![30;106m                                                      !ESC![0m
)
if %extra% GTR 0 (
   echo !ESC![93;44m                                                      !ESC![0m
   echo !ESC![93;44m  NOTE: *EXTRA Files are in the destination folders   !ESC![0m
   echo !ESC![93;44m                                                      !ESC![0m
)

goto :done

::----------------------------

:copyFiles
:: call copyFiles src dest some extra missed {extra parameters}

set /a test=0

:: get command parameters - 
for /f "tokens=1-5*" %%a in ("%*") do (
   set "src=%%a"
   set "dest=%%b"
   set /a "some=%%c"
   set /a "extra=%%d"
   set /a "missed=%%e"
   set "parms=%%f"
)
if %test% EQU 1 (
   echo src=%src%
   echo dest=%dest%
   echo some=%some%
   echo extra=%extra%
   echo missed=%missed%
   echo parms=%parms%
)

set "ext=*.php *.html *.css *.js *.json *.ini"
set roboparms=/s /r:0 /fft /j /xd .hg /xo /xj /w:5 /njh /ndl /njs /copy:dt

if %test% EQU 1 (
   echo C:\Windows\SysWOW64\Robocopy.exe %src% %dest% %ext% %roboparms% %parms%
) else (
   C:\Windows\SysWOW64\Robocopy.exe %src% %dest% %ext% %roboparms% %parms%
)

set err=%ERRORLEVEL%
if %test% EQU 1 echo ERRORLEVEL=%err%

::show failed folder
if errorlevel 8 echo !ESC![31;103mWARNING: Failed copying some files from %src%!ESC![K!ESC![0m

set /a "some |= err & 1"
set /a "extra |= err & 2"
set /a "missed |= err & 8"
set /a "missed |= err & 16"

::if %extra% GTR 0 (
::   echo [%err%] extra files in %dest%
::   set /a extra=0
::)

:: set cumulative return values:
   ::some
   set /a "%3|=some"

   ::extra files
   set /a "%4|=extra"

   ::missed files
   set /a "%5|=missed"

goto :eof


::----------------------------

:done

echo !ESC![0m
pause>nul|set /p wait=!ESC![30;103m Press any key to exit !ESC![0m
echo !CR!Done                         
echo.
:: Set title back to  previous valud
if NOT "!prevTitle!" == "" (
   title !prevTitle!
)

goto :eof

::----------------------------

:calcSpecialChars

::Calculates CR, DEL, and ESC

:: Get Carriage return
:: CR can only be used with DelayedExpansion
for /f %%a in ('copy /Z "%~dpf0" nul') do set "%~1=%%a"

:: Get DEL=Ascii-08 and ESC=Ascii-27
:: DEL and ESC can be used  with and without DelayedExpansion
setlocal
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  ENDLOCAL
  set "%~2=%%a"
  set "%~3=%%b"
)
goto :eof
