@ECHO OFF

REM -- Uncomment to Init NPM first run --
REM CALL ..\..\set-npm.bat

ECHO Compiling JS...
CD ..\ClientMVC
CALL grunt
CD ..\deploy
pause

ECHO Preparing NuGet...
CALL ..\..\set-nuget-key.bat
del *.nupkg
del content\Scripts\* /Q
mkdir content
mkdir content\Scripts
copy ..\ClientMVC\client-mvc.js content\Scripts
copy ..\ClientMVC\client-mvc.min.js content\Scripts
pause

ECHO Publishing to NPM...
CALL npm publish ..\ClientMVC
pause

ECHO Publishing to NuGet...
nuget pack client-mvc.nuspec
nuget push *.nupkg
pause