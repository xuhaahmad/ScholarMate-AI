import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Profile from "./pages/Profile";
import Results from "./pages/Results";
import Home from "./pages/Home";
import ScholarshipDetails from "./pages/ScholarshipDetails";
import Loading from "./pages/Loading";
function AnimatedRoutes() {

    const location = useLocation();


    return (

        <AnimatePresence mode="wait">


            <Routes location={location} key={location.pathname}>


                <Route
                    path="/scholarship-details"
                    element={
                        <Page>
                            <ScholarshipDetails />
                        </Page>
                    }
                />


                <Route
                    path="/loading"
                    element={
                        <Page>
                            <Loading />
                        </Page>
                    }
                />


                <Route
                    path="/"
                    element={
                        <Page>
                            <Home />
                        </Page>
                    }
                />


                <Route
                    path="/profile"
                    element={
                        <Page>
                            <Profile />
                        </Page>
                    }
                />


                <Route
                    path="/results"
                    element={
                        <Page>
                            <Results />
                        </Page>
                    }
                />


            </Routes>


        </AnimatePresence>

    );

}





function Page({children}) {


    return (

        <motion.div

        initial={{
            opacity:0,
            y:20
        }}

        animate={{
            opacity:1,
            y:0
        }}

        exit={{
            opacity:0,
            y:-20
        }}

        transition={{
            duration:0.35
        }}

        >

            {children}

        </motion.div>

    );

}





function App() {


    return (

        <BrowserRouter>

            <AnimatedRoutes />

        </BrowserRouter>

    );

}


export default App;