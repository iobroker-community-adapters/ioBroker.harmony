import React from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { Paper } from '@mui/material';
import { AdminConnection, Loader, GenericApp, type GenericAppProps } from '@iobroker/adapter-react-v5';
import HarmonyTab from './components/HarmonyTab';
import enLang from './i18n/en.json';
import deLang from './i18n/de.json';
import esLang from './i18n/es.json';
import frLang from './i18n/fr.json';
import itLang from './i18n/it.json';
import nlLang from './i18n/nl.json';
import plLang from './i18n/pl.json';
import ptLang from './i18n/pt.json';
import ruLang from './i18n/ru.json';
import ukLang from './i18n/uk.json';
import zhCnLang from './i18n/zh-cn.json';

export default class App extends GenericApp {
    constructor(props: GenericAppProps) {
        const extendedProps: GenericAppProps = { ...props };
        extendedProps.bottomButtons = false;
        // @ts-expect-error AdminConnection typing
        extendedProps.Connection = AdminConnection;
        extendedProps.adapterName = 'harmony';
        extendedProps.translations = {
            en: enLang,
            de: deLang,
            es: esLang,
            fr: frLang,
            it: itLang,
            nl: nlLang,
            pl: plLang,
            pt: ptLang,
            ru: ruLang,
            uk: ukLang,
            'zh-cn': zhCnLang,
        };
        super(props, extendedProps);
        const theme = this.createTheme();
        this.state = {
            ...this.state,
            theme,
            themeName: this.getThemeName(theme),
            themeType: this.getThemeType(theme),
        };
    }

    render(): React.JSX.Element {
        if (!this.state.loaded) {
            return (
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <Loader themeType={this.state.themeType} />
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }
        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <Paper square elevation={0} sx={{ height: '100%', overflow: 'auto' }}>
                        <HarmonyTab
                            socket={this.socket}
                            themeType={this.state.themeType}
                            theme={this.state.theme}
                            adapterName="harmony"
                            instance={this.instance}
                        />
                    </Paper>
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}
