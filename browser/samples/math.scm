(define degrees-to-radians (lambda (x)
  (* x (/ PI 180))))

(= (sin (degrees-to-radians 90))
   (cos (degrees-to-radians 0)))
   
(define (square x) (* x x))

(= 5 (sqrt (square 5)))

(abs -1.5)

(floor (* 10 (log 5)))